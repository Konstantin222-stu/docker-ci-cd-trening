import { useEffect, useState } from 'react';

interface Item {
  id: number;
  title: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/items`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка запроса: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Item[]) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ padding: 24 }}>Загрузка...</p>;
  }

  if (error) {
    return <p style={{ padding: 24, color: 'crimson' }}>Ошибка: {error}</p>;
  }

  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Элементы из базы</h1>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </main>
  );
}

export default App;