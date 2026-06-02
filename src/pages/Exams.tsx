import { useState, useEffect, useRef } from 'react';
import { getAvailableExams, getExamQuestions, submitExam } from '../api/exams';
import Layout from '../components/layout/Layout';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { type Exam, type ExamQuestion } from '../types/index';
import toast from 'react-hot-toast';
import {
  BookOpen, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Send, AlertCircle
} from 'lucide-react';

type ExamView = 'list' | 'taking' | 'result';

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ExamView>('list');

  // Taking exam state
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [attemptId, setAttemptId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const timerRef = useRef<any>(null);

  const fetchExams = async () => {
    try {
      const res = await getAvailableExams();
      setExams(res.data.exams);
      setEligible(res.data.eligible);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  // Countdown timer
  useEffect(() => {
    if (view === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [view, timeLeft]);

  const handleStartExam = async (exam: Exam) => {
    try {
      const res = await getExamQuestions(exam.id);
      setCurrentExam(res.data.exam);
      setQuestions(res.data.questions);
      setAttemptId(res.data.attempt_id);
      setAnswers({});
      setCurrentQ(0);
      setTimeLeft(res.data.exam.duration_minutes * 60);
      setView('taking');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load exam');
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = questions.length - Object.keys(answers).length;
      if (unanswered > 0) {
        const confirm = window.confirm(
          `You have ${unanswered} unanswered question(s). Submit anyway?`
        );
        if (!confirm) return;
      }
    }

    clearInterval(timerRef.current);
    setSubmitting(true);

    try {
      const res = await submitExam(currentExam.id, {
        attempt_id: attemptId,
        answers
      });
      setResult(res.data);
      setView('result');
      fetchExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewExamResult = (exam: Exam) => {
    setCurrentExam(exam);
    const score = exam.my_score ?? 0;
    const percentage = exam.my_percentage ?? (exam.my_score != null ? Math.round((score / exam.total_marks) * 100) : 0);
    setResult({
      passed: exam.my_passed,
      score,
      total_marks: exam.total_marks,
      percentage,
      pass_mark: exam.pass_mark,
    });
    setView('result');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) return <Layout><Spinner /></Layout>;

  // Exam Result View
  if (view === 'result' && result) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto space-y-6">
          <div className={`rounded-2xl p-8 text-center ${
            result.passed ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            {result.passed
              ? <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
              : <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            }
            <h2 className={`text-2xl font-bold mb-2 ${
              result.passed ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.passed ? 'Congratulations! You Passed!' : 'You Did Not Pass'}
            </h2>
            <p className="text-gray-600 mb-6">{currentExam?.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-gray-800">{result.score}</p>
                <p className="text-xs text-gray-500">Your Score</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-gray-800">{result.total_marks}</p>
                <p className="text-xs text-gray-500">Total Marks</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-2xl font-bold text-gray-800">{result.percentage}%</p>
                <p className="text-xs text-gray-500">Percentage</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Pass mark: {result.pass_mark}/{result.total_marks}
            </p>

            <button
              onClick={() => setView('list')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm transition"
            >
              Back to Exams
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Taking Exam View
  if (view === 'taking' && questions.length > 0) {
    const q = questions[currentQ];
    const answeredCount = Object.keys(answers).length;
    const progress = ((currentQ + 1) / questions.length) * 100;
    const isLowTime = timeLeft < 300; // less than 5 minutes

    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Exam Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-800">{currentExam?.title}</h2>
              <p className="text-sm text-gray-500">
                Question {currentQ + 1} of {questions.length} —
                {answeredCount} answered
              </p>
            </div>
            <div className={`flex items-center gap-2 text-lg font-bold px-4 py-2 rounded-lg ${
              isLowTime ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <div className="flex items-start gap-3">
              <span className="bg-amber-100 text-amber-700 text-sm font-bold px-2.5 py-1 rounded-full shrink-0">
                Q{currentQ + 1}
              </span>
              <p className="text-gray-800 font-medium leading-relaxed">{q.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = `option_${opt.toLowerCase()}` as keyof ExamQuestion;
                const isSelected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50 text-amber-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {opt}
                    </span>
                    <span>{q[optKey] as string}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
              disabled={currentQ === 0}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Question Numbers */}
            <div className="hidden sm:flex flex-wrap gap-1.5 justify-center flex-1">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition ${
                    i === currentQ
                      ? 'bg-amber-600 text-white'
                      : answers[questions[i].id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentQ === questions.length - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 transition"
              >
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm transition"
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Exam List View
  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Promotion Examinations</h2>
          <p className="text-gray-500 text-sm">Digital promotion exams for eligible teachers</p>
        </div>

        {/* Eligibility Notice */}
        {!eligible && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Exam Access Restricted</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                You need an approved promotion application to sit promotion exams.
                Apply for promotion first and wait for HR approval.
              </p>
            </div>
          </div>
        )}

        {/* Exams List */}
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No exams available</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for published exams</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <BookOpen size={18} className="text-amber-600" />
                      <h3 className="font-semibold text-gray-800">{exam.title}</h3>
                      {exam.my_attempt_status === 'submitted' && (
                        <Badge status={exam.my_passed ? 'approved' : 'rejected'} />
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-sm text-gray-500">{exam.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {exam.duration_minutes} minutes
                      </span>
                      <span>{exam.question_count} questions</span>
                      <span>Pass mark: {exam.pass_mark}/{exam.total_marks}</span>
                    </div>

                    {/* Score if submitted */}
                    {exam.my_attempt_status === 'submitted' && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        exam.my_passed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {exam.my_passed
                          ? <CheckCircle size={14} />
                          : <XCircle size={14} />
                        }
                        Score: {exam.my_score}/{exam.total_marks} —
                        {exam.my_passed ? ' PASSED' : ' FAILED'}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0">
                    {exam.my_attempt_status === 'submitted' ? (
                      <button
                        onClick={() => handleViewExamResult(exam)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm transition"
                      >
                        View Result
                      </button>
                    ) : exam.my_attempt_status === 'in_progress' ? (
                      <button
                        onClick={() => handleStartExam(exam)}
                        disabled={!eligible}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-40"
                      >
                        Continue Exam
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam)}
                        disabled={!eligible}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm transition disabled:opacity-40"
                      >
                        Start Exam
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Exams;