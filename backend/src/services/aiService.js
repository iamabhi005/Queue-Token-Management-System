const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');

/**
 * Intelligent Queue AI Assistant Service
 * Provides both real Gemini API integration and an intelligent unlimited fallback engine
 * that uses live database context to answer customer questions with zero rate limits.
 */

// Build dynamic system context using current live queue and database state
async function getLiveQueueContext(userTokenId = null) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [services, counters, waitingCount, servingTokens] = await Promise.all([
      Service.find({ isActive: true }).select('name description averageServiceTime'),
      Counter.find({ isActive: true }).populate('serviceId', 'name').select('name status currentToken serviceId'),
      Token.countDocuments({ createdAt: { $gte: todayStart }, status: 'WAITING' }),
      Token.find({ createdAt: { $gte: todayStart }, status: 'SERVING' }).populate('counterId', 'name').populate('serviceId', 'name')
    ]);

    let userTokenInfo = null;
    if (userTokenId) {
      const found = await Token.findById(userTokenId).populate('serviceId', 'name averageServiceTime').populate('counterId', 'name');
      if (found) {
        const ahead = await Token.countDocuments({
          serviceId: found.serviceId?._id,
          status: 'WAITING',
          createdAt: { $lt: found.createdAt }
        });
        userTokenInfo = {
          number: found.tokenNumber,
          customer: found.customerName,
          status: found.status,
          service: found.serviceId?.name,
          waitingAhead: ahead,
          counter: found.counterId?.name || null
        };
      }
    }

    return {
      totalWaiting: waitingCount,
      activeServices: services.map(s => ({
        name: s.name,
        avgTime: `${s.averageServiceTime} mins`,
        description: s.description
      })),
      openCounters: counters.map(c => ({
        name: c.name,
        service: c.serviceId?.name || 'General',
        status: c.status,
        currentToken: c.currentToken || 'Available'
      })),
      nowServing: servingTokens.map(t => ({
        token: t.tokenNumber,
        service: t.serviceId?.name,
        counter: t.counterId?.name
      })),
      userToken: userTokenInfo
    };
  } catch (err) {
    console.warn('[AI Service] Failed to gather queue context:', err.message);
    return { totalWaiting: 0, activeServices: [], openCounters: [], nowServing: [] };
  }
}

/**
 * Unlimited Intelligent Response Engine
 * Understands natural questions about wait times, tokens, services, operating hours, and queue status.
 */
function generateContextualAnswer(message, context) {
  const query = (message || '').toLowerCase();

  // 1. Inquiries about user's specific token
  if (context.userToken && (query.includes('my token') || query.includes('my status') || query.includes('my ticket') || query.includes('where am i') || query.includes('how long'))) {
    const t = context.userToken;
    if (t.status === 'WAITING') {
      return `Your ticket **${t.number}** (${t.customer}) is currently **WAITING** in queue for **${t.service}**. There are currently **${t.waitingAhead}** customer(s) ahead of you. Please keep an eye on the TV display board or listen for the audio chime!`;
    } else if (t.status === 'SERVING') {
      return `🎉 Good news! Your ticket **${t.number}** is now being called at **${t.counter || 'Counter'}**! Please proceed to the counter right away.`;
    } else if (t.status === 'COMPLETED') {
      return `Your ticket **${t.number}** has been marked as **COMPLETED**. Thank you for visiting SmartQueue today!`;
    } else if (t.status === 'SKIPPED') {
      return `Your ticket **${t.number}** was marked as **SKIPPED** because you were not at the counter when called. Please speak with a staff representative or generate a fresh ticket.`;
    }
  }

  // 2. Specific token number lookup in query (e.g., "A-102" or "A&CS-042")
  const tokenMatch = query.match(/([a-z&]{1,6}-\d{2,4})/i);
  if (tokenMatch) {
    const matchedNumber = tokenMatch[1].toUpperCase();
    const isNowServing = context.nowServing.find(s => s.token.toUpperCase() === matchedNumber);
    if (isNowServing) {
      return `Token **${matchedNumber}** is currently being served at **${isNowServing.counter || 'a service station'}** for ${isNowServing.service}.`;
    }
  }

  // 3. Waiting time / Queue backlog questions
  if (query.includes('wait') || query.includes('time') || query.includes('how long') || query.includes('busy') || query.includes('crowd')) {
    const waitCount = context.totalWaiting;
    let traffic = waitCount > 10 ? 'moderately busy' : waitCount > 0 ? 'flowing smoothly' : 'very quiet with zero backlog';
    let serviceList = context.activeServices.map(s => `• **${s.name}** (~${s.avgTime})`).join('\n');
    return `Currently, our queue is **${traffic}** with **${waitCount} waiting customer(s)** across all departments.\n\nAverage service speeds:\n${serviceList}\n\nTo skip the line, issue your token from the "Issue New Token" tab!`;
  }

  // 4. Available Services / Departments
  if (query.includes('service') || query.includes('department') || query.includes('help with') || query.includes('what do you offer') || query.includes('card') || query.includes('loan') || query.includes('teller')) {
    let serviceList = context.activeServices.map(s => `• **${s.name}**: ${s.description || 'Standard service desk'} (Est. ${s.avgTime})`).join('\n');
    return `We currently have **${context.activeServices.length} active service departments**:\n\n${serviceList}\n\nSelect any of these when generating your digital queue pass.`;
  }

  // 5. Counters status / Now Serving
  if (query.includes('counter') || query.includes('serving') || query.includes('who is next') || query.includes('display')) {
    const countersCount = context.openCounters.length;
    let servingList = context.nowServing.length > 0
      ? context.nowServing.map(s => `• **${s.token}** at **${s.counter || 'Counter'}** (${s.service})`).join('\n')
      : '• All counters are currently preparing for the next customer.';

    return `Currently, **${countersCount} counter station(s)** are active.\n\nNow Serving:\n${servingList}\n\nYou can also watch the live public TV display screen at \`/display\`.`;
  }

  // 6. Documents required questions
  if (query.includes('document') || query.includes('id') || query.includes('requirement') || query.includes('need to bring') || query.includes('paper')) {
    return `📋 **General Checklist for Your Visit:**\n\n1. **Government ID**: Passport, Driver's License, or National ID.\n2. **Account / Reference Number**: Any existing account paperwork or booking ID.\n3. **Specific Documents**:\n   • *Card/Account Services*: Proof of address & identification.\n   • *Loans & Mortgages*: Recent pay slips, tax filings, or bank statements.\n   • *Cash Deposits/Withdrawals*: Debit card or signed withdrawal slip.\n\nPlease show your digital ticket number when called to the counter!`;
  }

  // 7. Operating hours & contact
  if (query.includes('hour') || query.includes('time open') || query.includes('close') || query.includes('schedule') || query.includes('when')) {
    return `🕒 **SmartQueue Operations Schedule:**\n• **Monday – Friday**: 8:30 AM – 5:30 PM\n• **Saturday**: 9:00 AM – 2:00 PM\n• **Sunday & Public Holidays**: Closed\n\n*Tip: The shortest queues are typically between 9:00 AM – 11:00 AM.*`;
  }

  // 8. Greetings
  if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('good morning') || query.includes('good afternoon')) {
    return `Hello! 👋 Welcome to SmartQueue AI Assistant. I can help you with:\n\n• Checking estimated wait times\n• Tracking your live token position\n• Recommending the right department\n• Finding documents required for your appointment\n\nHow can I help you today?`;
  }

  // 9. Default friendly assistant response
  return `I am here to assist you with your SmartQueue visit! Currently there are **${context.totalWaiting} waiting customer(s)** in the facility.\n\nYou can ask me:\n• *"How long is the wait right now?"*\n• *"What services are available?"*\n• *"What documents do I need?"*\n• *"Check my token status"*`;
}

/**
 * Handle AI query using Gemini API if key is configured,
 * otherwise seamlessly fallback to the unlimited live context engine.
 */
async function processChatMessage({ message, conversationHistory = [], userTokenId = null }) {
  const context = await getLiveQueueContext(userTokenId);

  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_')) {
    try {
      // Call Google Gemini API (gemini-1.5-flash)
      const prompt = `You are SmartQueue AI, a helpful, polite customer assistant for a real-time queue and token management facility.
Current facility queue context:
- Total waiting customers: ${context.totalWaiting}
- Active departments: ${JSON.stringify(context.activeServices)}
- Open service counters: ${JSON.stringify(context.openCounters)}
- Currently serving tokens: ${JSON.stringify(context.nowServing)}
${context.userToken ? `- Active Customer Ticket Info: ${JSON.stringify(context.userToken)}` : ''}

Customer query: "${message}"

Please respond clearly, concisely, and warmly. If asked about wait times or tokens, refer to the live context provided above.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          return {
            reply: candidate,
            source: 'gemini-1.5-flash',
            context
          };
        }
      } else {
        console.warn(`[AI Service] Gemini API returned status ${response.status}, falling back to unlimited live engine.`);
      }
    } catch (err) {
      console.warn('[AI Service] Gemini API fetch error:', err.message, '-> using unlimited live engine.');
    }
  }

  // Unlimited built-in intelligent engine fallback
  const reply = generateContextualAnswer(message, context);
  return {
    reply,
    source: 'unlimited-smartqueue-engine',
    context
  };
}

module.exports = {
  processChatMessage,
  getLiveQueueContext
};
