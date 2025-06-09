import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Tabs, Form, Input, Button, Alert, InputNumber, Row, Col, Typography } from 'antd';
import { ec as EC } from 'elliptic';
import SHA256 from 'crypto-js/sha256';
import { Buffer } from 'buffer';
import { TransactionOutlined } from '@ant-design/icons'; // Added TransactionOutlined
import CopyableText from '@/components/Common/CopyableText'; // Import CopyableText

const { TabPane } = Tabs;
const { Text, Title } = Typography; // Destructured Title

// Initialize elliptic curve
const ec = new EC('secp256k1');

const PKTransactionPage: NextPage = () => {
  const { t } = useTranslation('common');

  // --- State Variables ---
  // Key Pair
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // Sign Tab
  const [signAmount, setSignAmount] = useState<string>("20.00");
  const [signFrom, setSignFrom] = useState(''); // This will be auto-filled by public key
  const [signTo, setSignTo] = useState('RecipientPublicKeyExample');
  const [signPrivateKey, setSignPrivateKey] = useState('');
  const [signSignature, setSignSignature] = useState('');

  // Verify Tab
  const [verifyAmount, setVerifyAmount] = useState<string>("20.00");
  const [verifyFrom, setVerifyFrom] = useState(''); // This will be auto-filled by public key
  const [verifyTo, setVerifyTo] = useState('RecipientPublicKeyExample');
  const [verifySignature, setVerifySignature] = useState('');

  // Alert
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Antd Forms - we can still use them for layout and validation messages, but not direct state control via useForm
  const [formSign] = Form.useForm();
  const [formVerify] = Form.useForm();

  // --- Effects for Synchronization and Initialization ---

  useEffect(() => {
    // Generate an initial key pair on load
    generateKeyPair();
    // Set initial "To" address for verify tab as well
    formVerify.setFieldsValue({ to_public_key_verify: 'RecipientPublicKeyExample', amount_verify: "20.00" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    formSign.setFieldsValue({
      from_public_key_sign: publicKey,
      private_key_sign: signPrivateKey, // Reflect generated or manually input private key
    });
    setSignFrom(publicKey);
  }, [publicKey, signPrivateKey, formSign]);

  useEffect(() => {
    formVerify.setFieldsValue({ from_public_key_verify: publicKey });
    setVerifyFrom(publicKey);
  }, [publicKey, formVerify]);

  // Sync Amount
  useEffect(() => { formVerify.setFieldsValue({ amount_verify: signAmount }); setVerifyAmount(signAmount); }, [signAmount, formVerify]);
  useEffect(() => { formSign.setFieldsValue({ amount_sign: verifyAmount }); setSignAmount(verifyAmount); }, [verifyAmount, formSign]);

  // Sync To Address
  useEffect(() => { formVerify.setFieldsValue({ to_public_key_verify: signTo }); setVerifyTo(signTo); }, [signTo, formVerify]);
  useEffect(() => { formSign.setFieldsValue({ to_public_key_sign: verifyTo }); setSignTo(verifyTo); }, [verifyTo, formSign]);

  // Sync Signature
  useEffect(() => { formVerify.setFieldsValue({ signature_verify: signSignature }); setVerifySignature(signSignature) }, [signSignature, formVerify]);
  // Note: No sync from verifySignature to signSignature as that doesn't make sense.

  // Update public key if private key is manually changed
  useEffect(() => {
    if (signPrivateKey && signPrivateKey.length === 64) { // Basic validation for hex private key
      try {
        const keyPair = ec.keyFromPrivate(signPrivateKey, 'hex');
        const pubKey = keyPair.getPublic('hex');
        setPublicKey(pubKey);
        setGeneratedPrivateKey(signPrivateKey); // Assume manually entered key is the one to use
        setSignFrom(pubKey);
        setVerifyFrom(pubKey);
        setShowAlert(false);
      } catch (error) {
        setPublicKey('');
        setSignFrom('');
        setVerifyFrom('');
        setAlertMessage(t('ErrorDerivingPublicKey', 'Error deriving public key from private key. Ensure it is a valid hex private key.'));
        setAlertType('error');
        setShowAlert(true);
      }
    } else if (signPrivateKey) { // Not a valid length
        setPublicKey('');
        setSignFrom('');
        setVerifyFrom('');
    }
  }, [signPrivateKey, t]);


  // --- Core Functions ---
  const generateKeyPair = () => {
    const newKeyPair = ec.genKeyPair();
    const privKeyHex = newKeyPair.getPrivate('hex');
    const pubKeyHex = newKeyPair.getPublic('hex');

    setGeneratedPrivateKey(privKeyHex);
    setSignPrivateKey(privKeyHex); // Update form field for private key
    setPublicKey(pubKeyHex);

    setSignFrom(pubKeyHex); // Update state for sign tab
    setVerifyFrom(pubKeyHex); // Update state for verify tab

    formSign.setFieldsValue({ from_public_key_sign: pubKeyHex, private_key_sign: privKeyHex });
    formVerify.setFieldsValue({ from_public_key_verify: pubKeyHex });

    setSignSignature(''); // Clear any old signature
    setShowAlert(false);
    setAlertMessage(t('KeyPairGenerated', 'New key pair generated and public key fields updated.'));
    setAlertType('success');
    setShowAlert(true);
  };

  const handleSign = async () => {
    setShowAlert(false);
    // Values are taken from state directly now
    if (!generatedPrivateKey || !signFrom || !signTo || !signAmount) {
      setAlertMessage(t('MissingFieldsForSigning', 'Please ensure Amount, From, To, and Private Key are set. Generate a key pair if needed.'));
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    try {
      const keyPair = ec.keyFromPrivate(generatedPrivateKey, 'hex');
      // Ensure signFrom matches the public key derived from generatedPrivateKey
      if (keyPair.getPublic('hex') !== signFrom) {
          setAlertMessage(t('PrivateKeyMismatch', 'The provided "From (Public Key)" does not match the public key derived from the Private Key.'));
          setAlertType('error');
          setShowAlert(true);
          return;
      }

      const message = String(signAmount) + signFrom + signTo;
      const msgHash = SHA256(message).toString();

      const signature = keyPair.sign(msgHash);
      const derSign = signature.toDER('hex');

      setSignSignature(derSign);
      setVerifySignature(derSign); // Keep verify tab in sync
      formVerify.setFieldsValue({ signature_verify: derSign });


      setAlertMessage(t('TransactionSigned', 'Transaction signed successfully. Signature copied to Verify tab.'));
      setAlertType('success');
      setShowAlert(true);

    } catch (error) {
      console.error("Signing error:", error);
      setAlertMessage(t('SigningError', 'Error during signing. Check console for details. Ensure private key is correct.'));
      setAlertType('error');
      setShowAlert(true);
      setSignSignature('');
    }
  };

  const handleVerify = async () => {
    setShowAlert(false);
    // Values are taken from state directly
    if (!verifyAmount || !verifyFrom || !verifyTo || !verifySignature) {
      setAlertMessage(t('MissingFieldsForVerification', 'Please ensure Amount, From, To, and Signature are provided for verification.'));
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    try {
      const message = String(verifyAmount) + verifyFrom + verifyTo;
      const msgHash = SHA256(message).toString();

      // The public key (verifyFrom) must be in a format suitable for ec.keyFromPublic()
      // It expects an object with x and y coordinates, or a hex string (possibly prefixed with '04' for uncompressed)
      // For simplicity, assuming verifyFrom is a hex string.
      const key = ec.keyFromPublic(verifyFrom, 'hex');

      const isValid = key.verify(msgHash, verifySignature);

      if (isValid) {
        setAlertMessage(t('VerificationSuccess', 'Transaction signature verified successfully!'));
        setAlertType('success');
      } else {
        setAlertMessage(t('VerificationFailed', 'Transaction signature verification failed.'));
        setAlertType('error');
      }
      setShowAlert(true);

    } catch (error) {
      console.error("Verification error:", error);
      setAlertMessage(t('VerificationError', 'Error during verification. Check console. Ensure public key and signature are correct format.'));
      setAlertType('error');
      setShowAlert(true);
    }
  };

  // --- Render ---
  return (
    <>
      <Head>
        <title>{String(t('TransactionSigningTitle', 'Transaction Signing'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <Title level={1} style={{ marginBottom: '24px' }}>
          <TransactionOutlined style={{ marginRight: '12px' }} />
          {t('TransactionSigningPageTitle', 'Public/Private Key - Transaction Signing')}
        </Title>

        <Row gutter={16} style={{ marginBottom: '20px' }}>
          <Col>
            <Button type="primary" onClick={generateKeyPair}>
              {t('GenerateKeyPair', 'Generate New Key Pair')}
            </Button>
          </Col>
        </Row>
        {publicKey && (
          <div style={{ marginBottom: '20px' }}>
            <Text strong>{t('CurrentPublicKey', 'Current Public Key (Auto-filled in "From" fields)')}: </Text>
            <CopyableText textToCopy={publicKey} displayText={publicKey} />
            <br/>
            <Text strong>{t('CurrentPrivateKey', 'Current Private Key (Used for Signing)')}: </Text>
            <CopyableText textToCopy={generatedPrivateKey} displayText={generatedPrivateKey} />
          </div>
        )}

        {showAlert && (
          <Alert message={alertMessage} type={alertType} showIcon closable onClose={() => setShowAlert(false)} style={{ marginBottom: '20px' }} />
        )}

        <Tabs defaultActiveKey="1">
          <TabPane tab={t('Sign', 'Sign')} key="1">
            <Form form={formSign} layout="vertical" onFinish={handleSign} initialValues={{ amount_sign: signAmount, to_public_key_sign: signTo }}>
              <Form.Item
                label={t('Amount', 'Amount')}
                name="amount_sign"
                rules={[{ required: true, message: t('PleaseInputAmount', 'Please input the amount!') }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step="0.01" stringMode value={signAmount} onChange={(val) => setSignAmount(String(val))} />
              </Form.Item>
              <Form.Item
                label={t('FromPublicKey', 'From (Public Key)')}
                name="from_public_key_sign"
                rules={[{ required: true, message: t('PleaseInputFromPublicKey', 'Please input the From Public Key!') }]}
              >
                <Input value={signFrom} onChange={(e) => setSignFrom(e.target.value)} placeholder={t('PublicKeyAutoFilled', 'Public key (auto-filled or enter manually)')} />
              </Form.Item>
              <Form.Item
                label={t('ToPublicKey', 'To (Public Key)')}
                name="to_public_key_sign"
                rules={[{ required: true, message: t('PleaseInputToPublicKey', 'Please input the To Public Key!') }]}
              >
                <Input value={signTo} onChange={(e) => setSignTo(e.target.value)} />
              </Form.Item>
              <Form.Item
                label={t('PrivateKey', 'Private Key (Hex)')}
                name="private_key_sign"
                rules={[{ required: true, message: t('PleaseInputPrivateKey', 'Please input your Private Key!') }]}
              >
                <Input.Password value={signPrivateKey} onChange={(e) => setSignPrivateKey(e.target.value)} placeholder={t('PrivateKeyForSigning', 'Private key for signing (auto-filled or enter manually)')} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {t('SignTransaction', 'Sign Transaction')}
                </Button>
              </Form.Item>
              <Form.Item label={t('MessageSignature', 'Message Signature')}>
                <Input.TextArea value={signSignature} rows={4} readOnly disabled placeholder={t('SignatureWillAppearHere', 'Signature will appear here')} />
              </Form.Item>
            </Form>
          </TabPane>
          <TabPane tab={t('Verify', 'Verify')} key="2">
            <Form form={formVerify} layout="vertical" onFinish={handleVerify} initialValues={{ amount_verify: verifyAmount, to_public_key_verify: verifyTo }}>
              <Form.Item
                label={t('Amount', 'Amount')}
                name="amount_verify"
                rules={[{ required: true, message: t('PleaseInputAmount', 'Please input the amount!') }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step="0.01" stringMode value={verifyAmount} onChange={(val) => setVerifyAmount(String(val))} />
              </Form.Item>
              <Form.Item
                label={t('FromPublicKey', 'From (Public Key)')}
                name="from_public_key_verify"
                rules={[{ required: true, message: t('PleaseInputFromPublicKey', 'Please input the From Public Key!') }]}
              >
                <Input value={verifyFrom} onChange={(e) => setVerifyFrom(e.target.value)} />
              </Form.Item>
              <Form.Item
                label={t('ToPublicKey', 'To (Public Key)')}
                name="to_public_key_verify"
                rules={[{ required: true, message: t('PleaseInputToPublicKey', 'Please input the To Public Key!') }]}
              >
                <Input value={verifyTo} onChange={(e) => setVerifyTo(e.target.value)} />
              </Form.Item>
              <Form.Item
                label={t('Signature', 'Signature (Hex DER)')}
                name="signature_verify"
                rules={[{ required: true, message: t('PleaseInputSignature', 'Please input the Signature!') }]}
              >
                <Input.TextArea value={verifySignature} rows={4} onChange={(e) => setVerifySignature(e.target.value)} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {t('VerifyTransaction', 'Verify Transaction')}
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default PKTransactionPage;
