import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <Construction className="mx-auto h-10 w-10 text-slate-300" />
      <h1 className="mt-4 text-xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">המסך הזה ייבנה בשלב הבא של הפרוטוטייפ.</p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
        חזרה לדשבורד
      </Link>
    </div>
  );
}
