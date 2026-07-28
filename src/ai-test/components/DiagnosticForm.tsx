import React, { useState } from 'react';
import { DIAGNOSTIC_QUESTIONS } from '../data/questions';
import { calculateScores } from '../utils/scoring';
import { DiagnosticResult } from '../types';

interface Props {
  onComplete: (result: DiagnosticResult) => void;
}

const DiagnosticForm: React.FC<Props> = ({ onComplete }) => {
  const DEFAULT_WEBHOOK = "https://script.google.com/macros/s/AKfycbzGfS9FZXy-GLX4fRGfKQLQzOitHWys-YSe4THEendkGKfpdQj4CiB43IlLlwVrOZkYug/exec";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('G_SHEET_WEBHOOK') || DEFAULT_WEBHOOK);

  const handleChoiceSelect = (questionId: string, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId.toString() }));
  };

  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus("분석 중...");

    try {
      // 1. Scoring
      const result = calculateScores(answers);
      
      // 2. Local delay to feel like processing
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Webhook Submission
      const targetUrl = webhookUrl;
      if (targetUrl) {
        setSubmissionStatus("결과를 스프레드시트로 전송 중...");
        try {
          await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors', // standard for GAS web apps
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...answers,
              totalScore: result.displayTotalScore,
              level: result.levelName,
              timestamp: new Date().toISOString()
            })
          });
        } catch (err) {
          console.error("Webhook submission failed:", err);
        }
      }

      onComplete(result);
    } catch (err) {
      console.error(err);
      setSubmissionStatus("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group questions by section
  const sections = Array.from(new Set(DIAGNOSTIC_QUESTIONS.map(q => q.section)));

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100">
        <h2 className="text-4xl font-black text-indigo-900 mb-10">생성형 AI 레벨 테스트</h2>
        <form onSubmit={handleSubmit} className="space-y-14">
          {sections.map(section => (
            <div key={section} className="space-y-8">
              <h3 className="text-2xl font-black text-slate-800 border-l-4 border-indigo-500 pl-4">{section}</h3>
              {DIAGNOSTIC_QUESTIONS.filter(q => q.section === section).map(q => (
                <div key={q.id} className="space-y-5">
                  <p className="text-lg font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {q.id.startsWith('Q') && !q.id.includes('Q1') && !q.id.includes('Q2') && !q.id.includes('Q3') ? `${q.id}. ` : ''}{q.question}
                  </p>
                  
                  {q.type === 'text' ? (
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5 text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="답변을 입력해주세요"
                      required
                      value={answers[q.id] || ''}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {q.options?.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleChoiceSelect(q.id, opt.id)}
                          className={`text-left px-8 py-5 rounded-2xl border transition-all text-lg ${
                            answers[q.id] === opt.id.toString()
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.01]'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                          }`}
                        >
                          <span className="mr-4 font-bold opacity-60">{opt.id}.</span>
                          {opt.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-7 rounded-[2rem] text-2xl font-black transition-all ${
              isSubmitting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (submissionStatus || '진단 중...') : '진단 완료 및 결과 보기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DiagnosticForm;
