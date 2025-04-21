import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3333;

// 🔐 Credenciais da API LivePix
const CLIENT_ID = 'fffaa2cb-96f8-4631-973f-4b44e7d50bcc';
const CLIENT_SECRET = 'YxFEXuZ64ePj1/mfERSDO6pizMun6Rt/ebhhGmAqJHFTNPp+nyRWJ3OFRIHL1BE7isc4B86BOQhHiqc9Ms/gy05fGkDbsAUn+5uGvHMvGtlro1znD9GaMCVGG2MlaCiDAIYkY+MLFlndKsmcF/TKlrYlh0osEIeCgUySbY/0j+s';

app.use(cors());
app.use(express.json());

app.post('/api/pix', async (req, res) => {
  const { amount } = req.body;

  console.log('🔁 Valor recebido:', amount);

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Valor inválido para gerar Pix.' });
  }

  try {
    // Autentica na LivePix
    const authRes = await axios.post(
      'https://oauth.livepix.gg/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'wallet:read payments:write',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const token = authRes.data.access_token;
    console.log('🔐 Token recebido');

    // Cria o pagamento Pix
    const paymentRes = await axios.post(
      'https://api.livepix.gg/v2/payments',
      {
        amount: parseInt(amount),
        currency: 'BRL',
        qrCode: true,
        redirectUrl: 'https://ajudeotigrao.com/obrigado',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { redirectUrl } = paymentRes.data.data;

    // 🔁 Retorna só o redirect como fallback (checkout direto)
    res.status(200).json({
      qrCodeImage: null,
      qrCodeText: redirectUrl,
    });
  } catch (err) {
    console.error('❌ Erro ao gerar Pix com LivePix:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao gerar QR Code com LivePix' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server do Pix rodando com Checkout LivePix em http://localhost:${PORT}`);
});
