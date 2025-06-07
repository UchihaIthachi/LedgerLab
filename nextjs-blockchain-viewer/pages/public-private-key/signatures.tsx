import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Form, Input, Button, Row, Col, Typography, Alert, Tabs } from 'antd';
import EC from 'elliptic';
import CryptoJS from 'crypto-js'; // crypto-js is already a dependency from blockchain part

const { Title, Paragraph } = Typography;
const ec = new EC.ec('secp256k1');

const SignaturesPage: NextPage = () => {
  const { t } = useTranslation('common');

  // States for Signing
  const [signMessage, setSignMessage] = useState<string>('');
  const [signPrivateKey, setSignPrivateKey] = useState<string>('');
  const [generatedSignature, setGeneratedSignature] = useState<string>('');
  const [signError, setSignError] = useState<string>('');

  // States for Verifying
  const [verifyMessage, setVerifyMessage] = useState<string>('');
  const [verifyPublicKey, setVerifyPublicKey] = useState<string>('');
  const [verifySignatureInput, setVerifySignatureInput] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState<string>('');

  // Attempt to load a key pair from keys.tsx (if it were persisted, e.g. via Context or localStorage)
  // For now, we'll just generate one on mount if needed for signing.
  useEffect(() => {
    if (!signPrivateKey) {
      try {
        const newKeyPair = ec.genKeyPair();
        setSignPrivateKey(newKeyPair.getPrivate('hex'));
        // Optionally pre-fill verifyPublicKey if we assume user wants to test with the generated key
        // setVerifyPublicKey(newKeyPair.getPublic('hex'));
      } catch (e) {
        console.error(e);
        setSignError(t('KeyGenerationError', 'Error generating temporary key pair for signing.'));
      }
    }
  }, [signPrivateKey, t]);


  const handleSignMessage = () => {
    if (!signMessage) {
      setSignError(t('MessageRequiredError', 'Message is required to sign.'));
      return;
    }
    if (!signPrivateKey) {
      setSignError(t('PrivateKeyRequiredError', 'Private key is required to sign.'));
      return;
    }

    try {
      const keyPair = ec.keyFromPrivate(signPrivateKey, 'hex');
      const hashedMessage = CryptoJS.SHA256(signMessage).toString(CryptoJS.enc.Hex);
      const signature = keyPair.sign(hashedMessage, 'hex'); // Provide {canonical: true} if needed
      setGeneratedSignature(signature.toDER('hex'));
      setSignError('');
    } catch (e) {
      console.error(e);
      setSignError(t('SigningError', 'Error signing message. Ensure private key is valid.'));
      setGeneratedSignature('');
    }
  };

  const handleVerifySignature = () => {
    if (!verifyMessage || !verifyPublicKey || !verifySignatureInput) {
      setVerifyError(t('AllFieldsRequiredError', 'Message, Public Key, and Signature are required for verification.'));
      setVerificationStatus('error');
      return;
    }

    try {
      const key = ec.keyFromPublic(verifyPublicKey, 'hex');
      const hashedMessage = CryptoJS.SHA256(verifyMessage).toString(CryptoJS.enc.Hex);
      const isValid = key.verify(hashedMessage, verifySignatureInput);

      if (isValid) {
        setVerificationStatus('success');
        setVerifyError('');
      } else {
        setVerificationStatus('error');
        setVerifyError(t('VerificationFailedError', 'Signature verification failed. Message, key, or signature may be incorrect.'));
      }
    } catch (e) {
      console.error(e);
      setVerificationStatus('error');
      setVerifyError(t('VerificationProcessError', 'Error during verification process. Ensure public key and signature formats are correct.'));
    }
  };

  const tabItems = [
    {
      key: 'sign',
      label: t('SignTab', 'Sign Message'),
      children: (
        <Form layout="vertical">
          <Form.Item label={t('MessageToSign', 'Message to Sign')}>
            <Input.TextArea rows={3} value={signMessage} onChange={e => setSignMessage(e.target.value)} />
          </Form.Item>
          <Form.Item label={t('PrivateKeyForSigning', 'Your Private Key')}>
            <Input.TextArea rows={3} value={signPrivateKey} onChange={e => setSignPrivateKey(e.target.value)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSignMessage} block>{t('SignTheMessage', 'Sign Message')}</Button>
          </Form.Item>
          {signError && <Alert message={signError} type="error" showIcon style={{ marginBottom: '16px' }} />}
          <Form.Item label={t('GeneratedSignature', 'Generated Signature (Hex DER)')}>
            <Input.TextArea rows={3} value={generatedSignature} readOnly />
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'verify',
      label: t('VerifyTab', 'Verify Signature'),
      children: (
        <Form layout="vertical">
          <Form.Item label={t('MessageToVerify', 'Message to Verify')}>
            <Input.TextArea rows={3} value={verifyMessage} onChange={e => setVerifyMessage(e.target.value)} />
          </Form.Item>
          <Form.Item label={t('SenderPublicKey', "Sender's Public Key (Hex)")}>
            <Input.TextArea rows={3} value={verifyPublicKey} onChange={e => setVerifyPublicKey(e.target.value)} />
          </Form.Item>
          <Form.Item label={t('SignatureToVerify', 'Signature to Verify (Hex DER)')}>
            <Input.TextArea rows={3} value={verifySignatureInput} onChange={e => setVerifySignatureInput(e.target.value)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleVerifySignature} block>{t('VerifyTheSignature', 'Verify Signature')}</Button>
          </Form.Item>
          {verificationStatus === 'success' && <Alert message={t('VerificationSuccess', 'Signature is valid!')} type="success" showIcon />}
          {verificationStatus === 'error' && verifyError && <Alert message={verifyError} type="error" showIcon />}
        </Form>
      )
    }
  ];

  return (
    <>
      <Head>
        <title>{t('SignaturesTitle', 'Digital Signatures')} - {t('Blockchain Demo')}</title>
      </Head>
      <div>
        <Title level={2}>{t('SignaturesPageTitle', 'Create & Verify Digital Signatures')}</Title>
        <Paragraph>
          {t('SignaturesPageDescription', 'Digital signatures allow you to verify the author of a message and that it has not been tampered with. Signing uses a private key, while verification uses the corresponding public key.')}
        </Paragraph>
        <Tabs defaultActiveKey="sign" items={tabItems} />
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default SignaturesPage;
