
import { StudentLevel, StructuredResponse } from '../types';
import { handlePhysicsExplanationRequest } from '../api/physicsEndpoint';

// This file now acts as a client for the SCS Backend API.
// It is responsible for making requests to the application layer.
// The direct interaction with the AI (Gemini) API has been moved to a simulated backend endpoint.

export const getPhysicsExplanation = async (
  topic: string,
  level: StudentLevel
): Promise<StructuredResponse> => {
    // In a production environment, this function would use fetch() to call a real API endpoint:
    // const response = await fetch('/api/physics-explanation', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ topic, level })
    // });
    // if (!response.ok) {
    //   throw new Error('Network response was not ok');
    // }
    // return response.json();

    // For this self-contained project, we directly invoke the backend function to simulate the API call.
    return handlePhysicsExplanationRequest(topic, level);
};
