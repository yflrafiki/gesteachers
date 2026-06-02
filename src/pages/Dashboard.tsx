import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../api/teachers';
import { getMyTransfers } from '../api/transfers';
import { getMyPromotions } from '../api/promotions';
import { getMyDocuments } from '../api/documents';
import Layout from '../components/layout/Layout';
import Badge from '../components/common/Badge';
import Spinner from '../components/common/Spinner';
import { type Teacher, type Application, type Document } from '../types/index';
import {
  User, ArrowLeftRight, TrendingUp,
  FileText, Clock
} from 'lucide-react';

const StatCard = ({
  icon: Icon, label, value, color
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 md:p-5 flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-gray-500 text-xs md:text-sm">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [transfers, setTransfers] = useState<Application[]>([]);
  const [promotions, setPromotions] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [p, t, pr, d] = await Promise.all([
          getMyProfile(),
          getMyTransfers(),
          getMyPromotions(),
          getMyDocuments(),
        ]);
        setProfile(p.data);
        setTransfers(t.data.applications);
        setPromotions(pr.data.applications);
        setDocuments(d.data.documents);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Layout><Spinner /></Layout>;

  const pendingTransfers = transfers.filter(t => t.status === 'pending').length;
  const pendingPromotions = promotions.filter(p => p.status === 'pending').length;
  const recentApplications = [...transfers, ...promotions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="bg-blue-900 text-white rounded-xl p-5 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold">
            Welcome, {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-blue-200 mt-1 text-sm">
            {profile?.current_school} — {profile?.current_district}, {profile?.current_region}
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs md:text-sm text-blue-100">
            <span>Staff ID: <strong>{profile?.staff_id}</strong></span>
            <span>Grade: <strong>{profile?.current_grade}</strong></span>
            <span>Years of Service: <strong>{profile?.years_of_service}</strong></span>
            <span>Qualification: <strong>{profile?.qualification}</strong></span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={ArrowLeftRight}
            label="Pending Transfers"
            value={pendingTransfers}
            color="bg-yellow-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Pending Promotions"
            value={pendingPromotions}
            color="bg-blue-500"
          />
          <StatCard
            icon={FileText}
            label="Total Documents"
            value={documents.length}
            color="bg-purple-500"
          />
        </div>

        {/* Recent Activity & Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Recent Applications
            </h3>
            {recentApplications.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">
                No applications yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700 capitalize">
                        {app.type} Application
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile Summary */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Profile Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Full Name', value: `${profile?.first_name} ${profile?.last_name}` },
                { label: 'Email', value: user?.email },
                { label: 'Subject', value: profile?.subject_specialization },
                { label: 'Qualification', value: profile?.qualification },
                { label: 'District', value: profile?.current_district },
                { label: 'Region', value: profile?.current_region },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-700 text-right max-w-[60%]">{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document & Credential Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              Recent Documents
            </h3>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No documents uploaded</p>
            ) : (
              <div className="space-y-3">
                {documents.slice(0, 4).map((doc) => (
                  <div key={doc.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-700 truncate">{doc.file_name}</p>
                    </div>
                    <Badge status={doc.ocr_status} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;