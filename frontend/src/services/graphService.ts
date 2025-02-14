import { API_BASE_URL } from '@/config';

export const saveGraph = async (dataUrl: string): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/explore/save-graph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving graph:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save graph'
    };
  }
};
