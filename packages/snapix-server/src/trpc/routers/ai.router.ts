import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import aiService from '../../services/ai.service';

export const aiRouter = router({
  // Main chat endpoint - process user message and return AI response
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1, 'Message cannot be empty'),
      context: z.record(z.any()).optional().default({}),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { message, context } = input;
        const userId = ctx.user.email; // Use email as consistent user ID
        
        // Enrich context with user information
        const enrichedContext = {
          ...context,
          userEmail: ctx.user.email,
          userId: ctx.user._id,
          userName: ctx.user.name,
        };

        console.log(`🎯 Processing AI request for user: ${ctx.user.email}`);
        
        // Process message with AI service
        const response = await aiService.processMessage(userId, message, enrichedContext);

        return {
          success: true,
          response,
          timestamp: new Date().toISOString(),
          fallback: false, // Will be true if using fallback response
        };
      } catch (error: any) {
        console.error('AI chat error:', error.message);
        
        // Return fallback response instead of throwing error
        const fallbackResponse = `מצטער, אני נתקל בבעיה זמנית. בינתיים, אני יכול לעזור לך עם:

📊 **ניתוח קמפיינים** - "הצג את הקמפיינים שלי השבוע"
💰 **אופטימיזציה** - "איך אני יכול לשפר את ה-ROAS?"
🎨 **קריאטיבים** - "מה הקריאטיב הכי טוב שלי?"
📈 **תובנות** - "תן לי תובנות על הקהל שלי"

נסה לשאול אותי שאלה ספציפית!`;

        return {
          success: true,
          response: fallbackResponse,
          timestamp: new Date().toISOString(),
          fallback: true,
          error: error.message,
        };
      }
    }),

  // Clear conversation history for current user
  clearConversation: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const userId = ctx.user.email;
        aiService.clearConversation(userId);
        
        return {
          success: true,
          message: 'Conversation cleared successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('Clear conversation error:', error.message);
        throw new Error(`Failed to clear conversation: ${error.message}`);
      }
    }),

  // Get AI service health and stats
  getHealth: protectedProcedure
    .query(async () => {
      try {
        const healthStatus = await aiService.healthCheck();
        
        return {
          success: true,
          data: healthStatus,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('AI health check error:', error.message);
        return {
          success: false,
          data: {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        };
      }
    }),

  // Get AI service statistics
  getStats: protectedProcedure
    .query(async () => {
      try {
        const stats = aiService.getStats();
        
        return {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('AI stats error:', error.message);
        throw new Error(`Failed to get AI stats: ${error.message}`);
      }
    }),

  // Quick help/suggestions endpoint
  getQuickHelp: protectedProcedure
    .query(async () => {
      const helpSuggestions = [
        {
          category: "ניתוח קמפיינים",
          icon: "📊",
          suggestions: [
            "הצג את הקמפיינים שלי השבוע",
            "מה הקמפיין הכי מוצלח שלי?",
            "איך הביצועים שלי השתנו החודש?",
          ]
        },
        {
          category: "אופטימיזציה",
          icon: "💰",
          suggestions: [
            "איך אני יכול לשפר את ה-ROAS?",
            "אילו קמפיינים כדאי לי להשבית?",
            "איך להקטין את עלות ההמרה?",
          ]
        },
        {
          category: "קריאטיבים",
          icon: "🎨",
          suggestions: [
            "מה הקריאטיב הכי טוב שלי?",
            "איך לשפר את ה-CTR של הקריאטיבים?",
            "אילו פורמטים עובדים הכי טוב?",
          ]
        },
        {
          category: "תובנות",
          icon: "📈",
          suggestions: [
            "תן לי תובנות על הקהל שלי",
            "מתי השעות הכי טובות לפרסום?",
            "איך הקהל שלי מתנהג?",
          ]
        }
      ];

      return {
        success: true,
        data: helpSuggestions,
        timestamp: new Date().toISOString(),
      };
    }),
});