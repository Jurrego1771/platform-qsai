import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'https://dev.platform.mediastre.am';
const API_TOKEN = process.env.SM2_API_TOKEN;
const ACCOUNT_ID = process.env.ACCOUNT_ID;

export class SmApi {
  #headers() {
    return {
      'Content-Type': 'application/json',
      'X-API-Token': API_TOKEN,
      'X-Account-Id': ACCOUNT_ID,
    };
  }

  async get(path) {
    const res = await fetch(`${BASE_URL}/api${path}`, { headers: this.#headers() });
    if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
    return res.json();
  }

  async post(path, body) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async patch(path, body) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method: 'PATCH',
      headers: this.#headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async delete(path) {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method: 'DELETE',
      headers: this.#headers(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error(`DELETE ${path} → ${res.status}: ${await res.text()}`);
    }
  }
}
