export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'ok',
    bot: 'MediBot AI',
    platform: 'Vercel Serverless',
  });
}
