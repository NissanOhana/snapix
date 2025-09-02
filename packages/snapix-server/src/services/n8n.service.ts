import axios from 'axios';

export class N8nService {
  async triggerWorkflow(workflowId: string, data: any) {
    try {
      const response = await axios.post(
        process.env.N8N_WEBHOOK_URL!,
        {
          workflowId,
          data,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'X-API-Key': process.env.N8N_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('n8n webhook error:', error);
      throw new Error('Failed to trigger n8n workflow');
    }
  }
}

export default new N8nService();