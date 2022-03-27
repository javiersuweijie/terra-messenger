import { getDeploymentConfig } from './helpers';

const { terra, wallet, networkConfig } = getDeploymentConfig('localterra');

(async () => {
  const chats = await terra.wasm.contractQuery(networkConfig.messengerAddr, {
    get_chats: {
      user: wallet.key.accAddress,
    },
  });
  console.log(chats);

  const messages = await terra.wasm.contractQuery(networkConfig.messengerAddr, {
    get_messages: {
      chat_id: 3,
    },
  });
  console.log(messages);
})();
