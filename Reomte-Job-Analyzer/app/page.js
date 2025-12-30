import React, { useState } from 'react';

export default function VAJobAnalyzer() {
  const [jobInput, setJobInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const analyzeJob = async () => {
    if (!jobInput.trim()) {
      setError('Please paste a job description');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `You are an expert VA career coach. Create a 14-day learning plan that teaches concepts directly.

JOB: ${jobInput}
SKILLS: ${skillsInput || 'Beginner'}

CRITICAL: Keep lessons concise (2-3 sentences max per lesson). Keep steps brief (one clear action per step).

Return valid JSON (escape all quotes, no line breaks in strings):
{
  "jobTitle": "title here",
  "salaryRange": "range",
  "skillGap": {
    "hasAlready": ["skill"],
    "needToLearn": ["skill1", "skill2"],
    "highImpact": ["skill"]
  },
  "learningPlan": {
    "week1": [{
      "day": 1,
      "focus": "Skill name",
      "lesson": "Brief 2-3 sentence explanation of concept and best practices.",
      "videoSearch": "youtube query",
      "practice": "Specific exercise",
      "deliverable": "What to submit",
      "estimatedTime": "2-3 hours"
    }],
    "week2": [{
      "day": 8,
      "focus": "Portfolio Part 1",
      "lesson": "Brief explanation",
      "steps": ["Open Google Docs", "Create title", "Add Challenge section", "Write Solution", "List Results"],
      "deliverable": "First portfolio piece",
      "estimatedTime": "3 hours"
    }]
  },
  "portfolioPieces": [{"title": "Item", "description": "What it shows"}],
  "aiAdvantage": "Brief explanation",
  "aiUseCases": ["Use 1", "Use 2"],
  "applicationTips": ["Tip 1", "Tip 2"]
}`
          }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        let text = data.content[0].text;
        
        // Clean up the response
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Remove any text before the first {
        const jsonStart = text.indexOf('{');
        if (jsonStart > 0) {
          text = text.substring(jsonStart);
        }
        
        // Remove any text after the last }
        const jsonEnd = text.lastIndexOf('}');
        if (jsonEnd > 0 && jsonEnd < text.length - 1) {
          text = text.substring(0, jsonEnd + 1);
        }
        
        // Try to parse
        try {
          const parsed = JSON.parse(text);
          setAnalysis(parsed);
        } catch (parseError) {
          // If parsing fails, try to fix common issues
          console.error('Parse error:', parseError);
          text = text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
          const parsed = JSON.parse(text);
          setAnalysis(parsed);
        }
      } else {
        throw new Error('No response from AI');
      }
    } catch (err) {
      console.error('Full error:', err);
      setError('Could not analyze job. The response was too complex. Try a simpler job description or try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadChecklist = () => {
    if (!analysis) return;
    let text = 'VA 14-DAY CHECKLIST\n\n';
    text += 'Job: ' + analysis.jobTitle + '\n';
    text += 'Salary: ' + analysis.salaryRange + '\n\n';
    text += 'GOOGLE DRIVE SETUP:\n';
    text += '- Create folder: VA Training - [Your Name]\n';
    text += '- Inside create: Day 1, Day 2, ... Day 14 folders\n';
    text += '- Share with your coach\n\n';
    text += 'WEEK 1: FOUNDATION SKILLS\n\n';
    
    analysis.learningPlan.week1.forEach(d => {
      text += 'DAY ' + d.day + ': ' + d.focus + '\n';
      text += 'Time: ' + (d.estimatedTime || '2-3 hours') + '\n\n';
      if (d.lesson) {
        text += 'LESSON (Read This First):\n';
        text += d.lesson + '\n\n';
      }
      text += 'VIDEO (Supplementary): Search YouTube for: ' + d.videoSearch + '\n\n';
      text += 'PRACTICE: ' + d.practice + '\n\n';
      text += 'SUBMIT: ' + d.deliverable + '\n';
      text += 'Upload to: Day ' + d.day + ' folder\n';
      text += '-------------------------------------------\n\n';
    });
    
    text += 'WEEK 2: PORTFOLIO & APPLICATIONS\n\n';
    analysis.learningPlan.week2.forEach(d => {
      text += 'DAY ' + d.day + ': ' + d.focus + '\n';
      text += 'Time: ' + (d.estimatedTime || '3-4 hours') + '\n\n';
      if (d.lesson) {
        text += 'INSTRUCTIONS:\n' + d.lesson + '\n\n';
      }
      if (d.steps && d.steps.length > 0) {
        text += 'STEP-BY-STEP:\n';
        d.steps.forEach((step, idx) => {
          text += (idx + 1) + '. ' + step + '\n';
        });
        text += '\n';
      }
      if (d.task) {
        text += d.task + '\n\n';
      }
      if (d.deliverable) {
        text += 'DELIVERABLE: ' + d.deliverable + '\n';
      }
      text += '-------------------------------------------\n\n';
    });

    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VA-14-Day-Checklist.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert('Download blocked. Copying to clipboard instead...');
      navigator.clipboard.writeText(text).then(() => {
        alert('Checklist copied to clipboard! Paste it into a text file.');
      }).catch(() => {
        alert('Please copy the text manually from the box that appears.');
      });
    }
  };

  const downloadPortfolio = () => {
    const text = 'VA PORTFOLIO TEMPLATE\n\n[YOUR NAME]\nVirtual Assistant | AI-Enhanced Productivity Expert\n\nPROFESSIONAL SUMMARY\nI am a Virtual Assistant specializing in [top 3 skills].\nUsing AI tools like ChatGPT and Claude, I deliver work 3x faster.\n\nSKILLS\n- Email Management\n- Calendar Management\n- Meeting Coordination\n- AI-Powered Productivity\n\nPORTFOLIO PIECE 1: [TITLE]\n\nCHALLENGE:\n[Describe the problem]\n\nSOLUTION:\n[What you did]\n\nRESULTS:\n- Reduced time by X%\n- Improved efficiency\n- Client satisfaction\n\nPORTFOLIO PIECE 2: [TITLE]\n[Repeat format]\n\nCONTACT\nEmail: [your email]\nAvailability: [your hours]';
    
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VA-Portfolio-Template.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      alert('Download blocked. Please copy the template from the text box below.');
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.width = '100%';
      textarea.style.height = '400px';
      textarea.style.padding = '15px';
      textarea.style.fontSize = '14px';
      textarea.style.fontFamily = 'monospace';
      document.body.appendChild(textarea);
      textarea.select();
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #fff 50%, #fae8ff 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #2563eb, #9333ea)', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', marginBottom: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            💼
          </div>
          <h1 style={{ fontSize: '2.5em', color: '#1f2937', marginBottom: '10px' }}>VA Job Analyzer</h1>
          <p style={{ fontSize: '1.2em', color: '#6b7280', marginBottom: '15px' }}>Your personalized 14-day path to becoming a hired Virtual Assistant</p>
          <div style={{ display: 'inline-block', padding: '8px 16px', background: '#d1fae5', border: '2px solid #10b981', borderRadius: '10px', color: '#065f46', fontWeight: 600 }}>
            ✨ Includes real resources + Google Drive workflow
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            Paste Virtual Assistant Job Description or URL
          </label>
          <textarea
            value={jobInput}
            onChange={(e) => setJobInput(e.target.value)}
            rows={8}
            placeholder="Paste the full VA job description here..."
            style={{ width: '100%', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95em', fontFamily: 'inherit', resize: 'vertical' }}
          />

          <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginTop: '20px', marginBottom: '8px' }}>
            Your Current Skills (Optional)
          </label>
          <textarea
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            rows={4}
            placeholder="E.g., Good with Gmail, basic Excel, customer service experience..."
            style={{ width: '100%', padding: '15px', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95em', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ fontSize: '0.85em', color: '#6b7280', marginTop: '6px' }}>Leave blank if starting from scratch!</p>

          {error && (
            <div style={{ background: '#fee2e2', border: '2px solid #ef4444', padding: '15px', borderRadius: '12px', color: '#991b1b', marginTop: '15px' }}>
              {error}
            </div>
          )}

          <button
            onClick={analyzeJob}
            disabled={loading}
            style={{ width: '100%', padding: '18px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #2563eb, #9333ea)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.05em', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '20px' }}
          >
            {loading ? '⏳ Creating Your Plan...' : '🎯 Analyze Job & Generate VA Learning Plan'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#6b7280', fontSize: '1.1em' }}>This takes 30-60 seconds...</p>
          </div>
        )}

        {analysis && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '2px solid #10b981', borderRadius: '20px', padding: '25px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '20px' }}>📥 Get Your Training Materials</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <button onClick={downloadChecklist} style={{ background: 'white', border: '2px solid #059669', color: '#065f46', padding: '15px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  📋 Download Checklist
                </button>
                <button onClick={downloadPortfolio} style={{ background: 'white', border: '2px solid #059669', color: '#065f46', padding: '15px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  📄 Download Portfolio
                </button>
              </div>
              <p style={{ fontSize: '0.85em', color: '#065f46', marginTop: '15px', textAlign: 'center' }}>
                💡 If downloads are blocked, the text will be copied to your clipboard automatically
              </p>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '20px' }}>💼 Job Analysis</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <p style={{ fontSize: '0.85em', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Job Title</p>
                  <p style={{ fontSize: '1.2em', fontWeight: 700, color: '#1f2937' }}>{analysis.jobTitle}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.85em', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Salary Range</p>
                  <p style={{ fontSize: '1.2em', fontWeight: 700, color: '#10b981' }}>{analysis.salaryRange}</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '20px' }}>🎯 Your Skill Gap</h2>
              
              {analysis.skillGap.hasAlready && analysis.skillGap.hasAlready.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 600, color: '#065f46', marginBottom: '10px' }}>✅ You Already Have</h3>
                  {analysis.skillGap.hasAlready.map((s, i) => (
                    <span key={i} style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85em', fontWeight: 500, margin: '5px', background: '#d1fae5', color: '#065f46', border: '1px solid #10b981' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 600, color: '#1e40af', marginBottom: '10px' }}>📚 You'll Learn in 14 Days</h3>
                {analysis.skillGap.needToLearn.map((s, i) => (
                  <span key={i} style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85em', fontWeight: 500, margin: '5px', background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' }}>
                    {s}
                  </span>
                ))}
              </div>

              <div style={{ background: 'linear-gradient(135deg, #faf5ff, #fce7f3)', padding: '20px', borderRadius: '15px', border: '2px solid #a855f7' }}>
                <h3 style={{ fontWeight: 600, color: '#581c87', marginBottom: '10px' }}>🚀 High Impact Skills</h3>
                {analysis.skillGap.highImpact.map((s, i) => (
                  <span key={i} style={{ display: 'inline-block', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85em', fontWeight: 600, margin: '5px', background: '#9333ea', color: 'white' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #2563eb, #9333ea)', color: 'white', borderRadius: '20px', padding: '30px', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.8em', marginBottom: '15px' }}>🤖 Your AI Superpower</h2>
              <p style={{ fontSize: '1.1em', lineHeight: 1.6, marginBottom: '15px' }}>{analysis.aiAdvantage}</p>
              {analysis.aiUseCases && (
                <div>
                  <p style={{ fontWeight: 600, marginBottom: '10px' }}>Daily AI uses:</p>
                  {analysis.aiUseCases.map((u, i) => (
                    <div key={i} style={{ margin: '5px 0' }}>✓ {u}</div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.5em', fontWeight: 700, marginBottom: '20px' }}>📖 Your 14-Day Learning Plan</h2>
              
              <h3 style={{ fontSize: '1.3em', fontWeight: 700, paddingBottom: '10px', borderBottom: '3px solid #dbeafe', marginBottom: '20px' }}>
                Week 1: Foundation Skills
              </h3>
              
              {analysis.learningPlan.week1.map((day, i) => (
                <div key={i} style={{ border: '2px solid #dbeafe', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ width: '45px', height: '45px', background: '#2563eb', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1em' }}>
                      {day.day}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.2em', fontWeight: 700 }}>{day.focus}</h4>
                      <p style={{ fontSize: '0.9em', color: '#6b7280' }}>{day.estimatedTime || '2-3 hours'}</p>
                    </div>
                  </div>

                  {day.lesson && (
                    <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '10px', padding: '20px', margin: '15px 0', fontSize: '0.95em', lineHeight: '1.7' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5em' }}>📚</span>
                        <strong style={{ fontSize: '1.1em', color: '#1e40af' }}>LESSON: Learn This Concept</strong>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#1f2937' }}>{day.lesson}</div>
                    </div>
                  )}

                  <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '12px', margin: '10px 0', fontSize: '0.9em' }}>
                    <strong>📹 WATCH (Supplementary)</strong><br />
                    Search YouTube: <code style={{ background: 'white', padding: '3px 8px', borderRadius: '5px' }}>{day.videoSearch}</code>
                  </div>

                  <div style={{ background: '#f3e8ff', border: '1px solid #a855f7', borderRadius: '10px', padding: '12px', margin: '10px 0', fontSize: '0.9em' }}>
                    <strong>💪 PRACTICE</strong><br />
                    {day.practice}
                  </div>

                  <div style={{ background: '#d1fae5', border: '1px solid #10b981', borderRadius: '10px', padding: '12px', margin: '10px 0', fontSize: '0.9em' }}>
                    <strong>✅ SUBMIT</strong><br />
                    {day.deliverable}<br />
                    <small>Upload to Day {day.day} folder</small>
                  </div>
                </div>
              ))}

              <h3 style={{ fontSize: '1.3em', fontWeight: 700, paddingBottom: '10px', borderBottom: '3px solid #f3e8ff', margin: '30px 0 20px' }}>
                Week 2: Portfolio & Applications
              </h3>

              {analysis.learningPlan.week2.map((day, i) => (
                <div key={i} style={{ border: '2px solid #f3e8ff', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ width: '45px', height: '45px', background: '#9333ea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1em' }}>
                      {day.day}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.2em', fontWeight: 700 }}>{day.focus}</h4>
                      <p style={{ fontSize: '0.9em', color: '#6b7280' }}>{day.estimatedTime || '3-4 hours'}</p>
                    </div>
                  </div>

                  {day.lesson && (
                    <div style={{ background: '#faf5ff', border: '2px solid #9333ea', borderRadius: '10px', padding: '20px', margin: '15px 0', fontSize: '0.95em', lineHeight: '1.7' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5em' }}>💡</span>
                        <strong style={{ fontSize: '1.1em', color: '#581c87' }}>INSTRUCTIONS</strong>
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap', color: '#1f2937' }}>{day.lesson}</div>
                    </div>
                  )}

                  {day.steps && day.steps.length > 0 && (
                    <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '10px', padding: '20px', margin: '15px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '1.5em' }}>📝</span>
                        <strong style={{ fontSize: '1.1em', color: '#92400e' }}>STEP-BY-STEP GUIDE</strong>
                      </div>
                      {day.steps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                          <div style={{ width: '28px', height: '28px', background: '#f59e0b', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85em', fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          <p style={{ margin: 0, paddingTop: '3px', fontSize: '0.95em' }}>{step}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {day.task && (
                    <div style={{ background: '#f3e8ff', border: '1px solid #a855f7', borderRadius: '10px', padding: '15px', margin: '10px 0' }}>
                      <p style={{ margin: 0 }}>{day.task}</p>
                    </div>
                  )}

                  {day.deliverable && (
                    <div style={{ background: '#d1fae5', border: '2px solid #10b981', borderRadius: '10px', padding: '15px', margin: '10px 0' }}>
                      <strong style={{ color: '#065f46' }}>✅ TODAY'S DELIVERABLE:</strong><br />
                      <p style={{ margin: '8px 0 0 0' }}>{day.deliverable}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #2563eb, #9333ea)', color: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '2em', marginBottom: '15px' }}>🎉 Ready to Become a VA!</h2>
              <p style={{ fontSize: '1.1em', marginBottom: '25px' }}>Download your materials and start Day 1 tomorrow!</p>
              <button onClick={downloadChecklist} style={{ background: 'white', color: '#2563eb', padding: '15px 40px', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1em', cursor: 'pointer' }}>
                📋 Download Complete Checklist
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}