import { MnemonicKey, MsgExecuteContract, Wallet } from '@terra-money/terra.js';
import {
  getDeploymentConfig,
  loadOrCreateWallet,
  sendTransaction,
} from './helpers';

const { terra, wallet, networkConfig } = getDeploymentConfig('localterra');
const user2 = 'terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp';
const user3 = 'terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95';
const user4 = 'terra199vw7724lzkwz6lf2hsx04lrxfkz09tg8dlp6r';

const seedChats = [
  {
    from: wallet,
    to: user3,
    message: 'hello',
  },
  {
    from: wallet,
    to: user4,
    message: 'hello',
  },
  {
    from: wallet,
    to: user2,
    message: 'hello',
  },
];

for (let i = 0; i < 15; i++) {
  seedChats.push({
    from: wallet,
    to: user2,
    message: `hello ${i}`,
  });
}

(async () => {
  if (!networkConfig.messengerAddr) {
    throw 'messenger contract not deployed or contract addr not set';
  }
  for (let chat of seedChats) {
    await sendTransaction(terra, wallet, [
      new MsgExecuteContract(
        wallet.key.accAddress,
        networkConfig.messengerAddr,
        {
          send_message: {
            to: chat.to,
            data: chat.message,
          },
        },
      ),
    ]);
  }
})();
