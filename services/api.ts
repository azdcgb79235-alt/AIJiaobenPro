const API = "http://192.168.0.100:3000";

export async function generateScript(prompt: string) {
  const response = await fetch(`${API}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error("Server Error");
  }

  return response.json();
}