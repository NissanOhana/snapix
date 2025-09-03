import OpenAI from 'openai';
import { optionalEnvVars } from '../env';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface UserConversation {
  userId: string;
  messages: ConversationMessage[];
  lastActivity: Date;
}

interface AIServiceStats {
  totalRequests: number;
  totalUsers: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export class AIService {
  private openai: OpenAI | null = null;
  private conversations: Map<string, UserConversation> = new Map();
  private stats: AIServiceStats;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.stats = {
      totalRequests: 0,
      totalUsers: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: 0
    };

    // Initialize OpenAI if API key is available
    if (optionalEnvVars.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: optionalEnvVars.OPENAI_API_KEY,
      });
      console.log('🤖 OpenAI client initialized');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found - AI features will use fallback responses');
    }
  }

  async processMessage(userId: string, message: string, context: any = {}): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.stats.totalRequests++;
      
      // Get or create user conversation
      let conversation = this.conversations.get(userId);
      if (!conversation) {
        conversation = {
          userId,
          messages: [],
          lastActivity: new Date()
        };
        this.conversations.set(userId, conversation);
        this.stats.totalUsers = this.conversations.size;
      }

      // Add user message to conversation
      conversation.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });
      conversation.lastActivity = new Date();

      let response: string;

      if (this.openai) {
        response = await this.generateAIResponse(conversation, context);
      } else {
        response = this.getFallbackResponse(message);
      }

      // Add assistant response to conversation
      conversation.messages.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      // Clean up old conversations (keep only last 50 messages per user)
      if (conversation.messages.length > 50) {
        conversation.messages = conversation.messages.slice(-50);
      }

      // Update stats
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, true);

      return response;

    } catch (error: any) {
      console.error('❌ AI Service error:', error.message);
      this.updateStats(Date.now() - startTime, false);
      
      // Return fallback response on error
      return this.getFallbackResponse(message, true);
    }
  }

  private async generateAIResponse(conversation: UserConversation, context: any): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare conversation history (last 10 messages to keep context manageable)
      const recentMessages = conversation.messages.slice(-10);
      const messages: any[] = [
        { role: 'system', content: systemPrompt }
      ];

      // Add recent conversation history
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return content.trim();

    } catch (error: any) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private buildSystemPrompt(context: any): string {
    return `אתה עוזר AI מקצועי לניהול קמפיינים בפייסבוק ומטא. אתה עוזר למשתמשים לנתח, לבצע אופטימיזציה ולקבל תובנות על הקמפיינים שלהם.

יכולות שלך כוללות:
📊 ניתוח ביצועי קמפיינים
💰 אופטימיזציה של ROAS ותקציבים
🎯 המלצות על קהלי יעד
🎨 ניתוח קריאטיבים והמלצות לשיפור
📈 זיהוי טרנדים ודפוסים בנתונים
⚡ טיפים לשיפור CTR ו-CVR

מידע על המשתמש:
- מייל: ${context.userEmail || 'לא זמין'}
- מזהה משתמש: ${context.userId || 'לא זמין'}

הנחיות חשובות:
1. תמיד תן תשובות מעשיות וישימות
2. השתמש בנתונים קונקרטיים כאשר זמינים
3. הסבר מושגים מורכבים בפשטות
4. תן המלצות ספציפיות לפעולה
5. אם אתה לא בטוח במשהו, תגיד זאת בכנות
6. השתמש באימוג'ים במידה והם מתאימים להקשר

תשובות קצרות יעילות מועדפות על פני תשובות ארוכות.`;
  }

  private getFallbackResponse(message: string, isError: boolean = false): string {
    if (isError) {
      return `מצטער, אני נתקל בבעיה זמנית. בינתיים, אני יכול לעזור לך עם:

📊 **ניתוח קמפיינים** - "הצג את הקמפיינים שלי השבוע"
💰 **אופטימיזציה** - "איך אני יכול לשפר את ה-ROAS?"
🎨 **קריאטיבים** - "מה הקריאטיב הכי טוב שלי?"
📈 **תובנות** - "תן לי תובנות על הקהל שלי"

נסה לשאול אותי שאלה ספציפית!`;
    }

    // Simple keyword-based responses for fallback
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('קמפיין') || lowerMessage.includes('campaign')) {
      return `💡 אני יכול לעזור לך עם ניתוח קמפיינים! 

כדי לקבל תובנות מדויקות, אני צריך גישה לנתונים שלך. אנא ודא שחיברת את חשבון הפייסבוק שלך ונסה שוב.

מה היית רוצה לדעת על הקמפיינים שלך?`;
    }

    if (lowerMessage.includes('roas') || lowerMessage.includes('תקציב') || lowerMessage.includes('עלות')) {
      return `💰 אופטימיזציה של תקציב ו-ROAS:

1. **בדוק את הקהלים** - קהלים רחבים לעתים יקרות יותר יעילים
2. **נסה Creative Testing** - בדוק כמה וריאציות
3. **שקול Lookalike Audiences** - בהשבת לקהלי הממירים הטובים שלך
4. **המתן לאלגוריתם** - תן 3-7 ימים לאופטימיזציה

רוצה שאבדוק משהו ספציפי בחשבון שלך?`;
    }

    if (lowerMessage.includes('קריאטיב') || lowerMessage.includes('creative') || lowerMessage.includes('עיצוב')) {
      return `🎨 טיפים לקריאטיבים טובים יותר:

1. **Hook חזק** - תפוס תשומת לב בשניות הראשונות
2. **בדיקת A/B** - נסה פורמטים שונים (וידאו, תמונה, קרוסל)
3. **UGC** - תוכן שמשתמשים יצרו עובד מצוין
4. **בדיקת טקסט** - נסה אורכי טקסט שונים
5. **רלוונטיות** - התאם לקהל המטרה

רוצה שאנתח את הקריאטיבים הנוכחיים שלך?`;
    }

    // Default response
    return `שלום! 👋 אני כאן לעזור לך עם ניהול וניתוח קמפיינים בפייסבוק.

אני יכול לעזור לך עם:
📊 ניתוח ביצועי קמפיינים
💰 אופטימיזציה של תקציבים ו-ROAS  
🎯 המלצות על קהלי יעד
🎨 שיפור קריאטיבים
📈 זיהוי טרנדים בנתונים

איך אני יכול לעזור לך היום?`;
  }

  clearConversation(userId: string): void {
    this.conversations.delete(userId);
    this.stats.totalUsers = this.conversations.size;
    console.log(`🧹 Cleared conversation for user: ${userId}`);
  }

  async healthCheck(): Promise<any> {
    this.stats.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    return {
      status: 'healthy',
      openai_available: !!this.openai,
      active_conversations: this.conversations.size,
      stats: this.stats,
      timestamp: new Date().toISOString()
    };
  }

  getStats(): AIServiceStats {
    this.stats.uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    return { ...this.stats };
  }

  private updateStats(responseTime: number, success: boolean): void {
    // Update average response time
    if (this.stats.totalRequests === 1) {
      this.stats.averageResponseTime = responseTime;
    } else {
      this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
    }

    // Update error rate
    if (!success) {
      const errors = Math.round(this.stats.totalRequests * this.stats.errorRate) + 1;
      this.stats.errorRate = errors / this.stats.totalRequests;
    } else {
      const errors = Math.round(this.stats.totalRequests * this.stats.errorRate);
      this.stats.errorRate = errors / this.stats.totalRequests;
    }
  }

  // Clean up old conversations periodically
  cleanupOldConversations(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    for (const [userId, conversation] of this.conversations.entries()) {
      if (conversation.lastActivity < oneHourAgo) {
        this.conversations.delete(userId);
      }
    }
    
    this.stats.totalUsers = this.conversations.size;
    console.log(`🧹 Cleaned up old conversations. Active conversations: ${this.conversations.size}`);
  }
}

// Create singleton instance
export default new AIService();

// Clean up old conversations every hour
setInterval(() => {
  try {
    const aiService = require('./ai.service').default;
    aiService.cleanupOldConversations();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1 hour