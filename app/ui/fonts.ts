//アプリ全体で使用するフォントを定義する
// Next.jsのFont Optimizationを使用して、フォントを最適化する
// https://nextjs.org/docs/app/building-your-application/optimizing/fonts
import { Inter, Lusitana } from 'next/font/google';
 
export const inter = Inter({ subsets: ['latin'] });
 
export const lusitana = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin'],
});