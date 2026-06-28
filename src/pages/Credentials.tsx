import { useState, useEffect } from 'react';
import { getMyCredentials } from '../api/credentials';
import Layout from '../components/layout/Layout';
import { CardListSkeleton } from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import { type Credential } from '../types/index';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Clock, Copy } from 'lucide-react';

const Credentials = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyCredentials();
        setCredentials(res.data.credentials);
      } catch (err) {
        toast.error('Failed to load credentials');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) return <Layout><CardListSkeleton /></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Blockchain Credentials</h2>
          <p className="text-gray-500 text-sm">Your verified credentials stored on the blockchain</p>
        </div>

        {/* Info */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
          <p className="font-medium mb-1">What is blockchain verification?</p>
          <p className="text-green-700">
            Each verified credential gets a unique transaction ID stored on our
            private Hyperledger Fabric blockchain. This makes your credentials
            tamper-proof and instantly verifiable by HR officers.
          </p>
        </div>

        {/* Credentials List */}
        {credentials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <Shield size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No verified credentials yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload a document and submit it for blockchain verification
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((cred) => (
              <div key={cred.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col gap-4">

                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {cred.verification_status === 'verified'
                        ? <CheckCircle size={24} className="text-green-500 shrink-0" />
                        : cred.verification_status === 'failed'
                        ? <XCircle size={24} className="text-red-500 shrink-0" />
                        : <Clock size={24} className="text-yellow-500 shrink-0" />
                      }
                      <div>
                        <p className="font-semibold text-gray-800">{cred.file_name}</p>
                        <p className="text-xs text-gray-400">
                          {cred.verified_at
                            ? `Verified: ${new Date(cred.verified_at).toLocaleDateString()}`
                            : `Created: ${new Date(cred.created_at).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <Badge status={cred.verification_status} />
                  </div>

                  {/* Blockchain Details */}
                  {cred.verification_status === 'verified' && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-gray-700 truncate flex-1">
                            {cred.blockchain_tx_id}
                          </p>
                          <button
                            onClick={() => copyToClipboard(cred.blockchain_tx_id)}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Document Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-mono text-gray-700 truncate flex-1">
                            {cred.document_hash}
                          </p>
                          <button
                            onClick={() => copyToClipboard(cred.document_hash)}
                            className="shrink-0 text-gray-400 hover:text-gray-600"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Credentials;