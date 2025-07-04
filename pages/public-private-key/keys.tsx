import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import { Form, Input, Button, Row, Col, Typography, Alert, Space } from 'antd';
import { KeyOutlined } from '@ant-design/icons'; // Added KeyOutlined
import EC from 'elliptic';
import CopyableText from '@/components/Common/CopyableText';
import GlossaryTerm from '@/components/Common/GlossaryTerm'; // Import GlossaryTerm

const { Title, Paragraph } = Typography;
const ec = new EC.ec('secp256k1');

const KeysPage: NextPage = () => {
  const { t } = useTranslation('common');
  const [privateKeyInput, setPrivateKeyInput] = useState<string>('');
  const [publicKeyDisplay, setPublicKeyDisplay] = useState<string>('');
  const [keyPair, setKeyPair] = useState<EC.ec.KeyPair | null>(null);
  const [error, setError] = useState<string>('');

  const generateNewKey = useCallback(() => {
    try {
      const newKeyPair = ec.genKeyPair();
      setKeyPair(newKeyPair);
      setPrivateKeyInput(newKeyPair.getPrivate('hex'));
      setPublicKeyDisplay(newKeyPair.getPublic('hex'));
      setError('');
    } catch (e) {
      console.error(e);
      setError(t('KeyGenerationError', 'Error generating key pair.'));
      setPublicKeyDisplay('');
    }
  }, [t]);

  // Generate a new key on component mount
  useEffect(() => {
    generateNewKey();
  }, [generateNewKey]);

  const handlePrivateKeyInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrivKey = e.target.value.trim();
    setPrivateKeyInput(newPrivKey);
    if (newPrivKey) {
      try {
        const pair = ec.keyFromPrivate(newPrivKey, 'hex');
        setKeyPair(pair);
        setPublicKeyDisplay(pair.getPublic('hex'));
        setError('');
      } catch (err) {
        // console.error("Invalid private key:", err);
        setKeyPair(null);
        setPublicKeyDisplay('');
        setError(t('InvalidPrivateKeyError', 'Invalid private key format or value.'));
      }
    } else {
      setKeyPair(null);
      setPublicKeyDisplay('');
      setError('');
    }
  };

  return (
    <>
      <Head>
        <title>{String(t('KeysTitle', 'Public/Private Keys'))} - {String(t('Blockchain Demo'))}</title>
      </Head>
      <div>
        <Title level={1} style={{ marginBottom: '24px' }}>
          <KeyOutlined style={{ marginRight: '12px' }} />
          {t('KeysPageTitle', 'Generate Public/Private Key Pair')}
        </Title>
        <Paragraph>
          {t('KeysPageDescription_part1', 'A ')}
          <GlossaryTerm termKey="private_key" />
          {t('KeysPageDescription_part2', ' is a secret number that allows you to send your cryptocurrency. A ')}
          <GlossaryTerm termKey="public_key" />
          {t('KeysPageDescription_part3', ' is derived from it and is what you share with others to receive funds. This uses elliptic curve cryptography (secp256k1), the same used by Bitcoin.')}
        </Paragraph>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form layout="vertical">
              <Form.Item label={t('PrivateKey', 'Private Key')}>
                <Input.TextArea
                  rows={4}
                  value={privateKeyInput}
                  onChange={handlePrivateKeyInputChange}
                  placeholder={t('EnterPrivateKeyPlaceholder', 'Enter a hex private key or generate one')}
                />
                {privateKeyInput && (
                  <div style={{ marginTop: '8px' }}>
                    <CopyableText textToCopy={privateKeyInput} />
                  </div>
                )}
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={generateNewKey} block>
                  {t('GenerateRandomKey', 'Generate Random Key')}
                </Button>
              </Form.Item>
            </Form>
          </Col>
          <Col xs={24} md={12}>
            <Form layout="vertical">
              <Form.Item label={t('PublicKey', 'Public Key')}>
                {publicKeyDisplay ? (
                  <CopyableText textToCopy={publicKeyDisplay} displayText={publicKeyDisplay} />
                ) : (
                  <Typography.Text type="secondary">
                    {t('PublicKeyDisplayPlaceholder', 'Public key will be displayed here')}
                  </Typography.Text>
                )}
              </Form.Item>
            </Form>
          </Col>
        </Row>
        {error && <Alert message={error} type="error" showIcon style={{marginTop: '16px'}} />}
      </div>
    </>
  );
};

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});

export default KeysPage;
