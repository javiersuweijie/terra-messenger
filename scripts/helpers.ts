import {
  LocalTerra,
  LCDClient,
  Wallet,
  Msg,
  Coin,
  isTxError,
  MsgStoreCode,
  MsgInstantiateContract,
  Fee,
  MnemonicKey,
  MsgExecuteContract,
  RawKey,
} from '@terra-money/terra.js';
import * as fs from 'fs';

/**
 * @notice Encode a JSON object to base64 binary
 */
export function toEncodedBinary(obj: any) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

/**
 * @notice Send a transaction. Return result if successful, throw error if failed.
 */
export async function sendTransaction(
  terra: LocalTerra | LCDClient,
  sender: Wallet,
  msgs: Msg[],
  verbose = false,
) {
  const tx = await sender.createAndSignTx({
    msgs,
    fee: new Fee(30000000, [
      new Coin('uluna', 450000),
      new Coin('uusd', 45000),
    ]),
  });

  const result = await terra.tx.broadcast(tx);

  // Print the log info
  if (verbose) {
    console.log('\nTxHash:', result.txhash);
    try {
      console.log(
        'Raw log:',
        JSON.stringify(JSON.parse(result.raw_log), null, 2),
      );
    } catch {
      console.log('Failed to parse log! Raw log:', result.raw_log);
    }
  }

  if (isTxError(result)) {
    throw new Error(
      'Transaction failed!' +
        `\n${'code'}: ${result.code}` +
        `\n${'codespace'}: ${result.codespace}` +
        `\n${'raw_log'}: ${result.raw_log}`,
    );
  }

  return result;
}

/**
 * @notice Upload contract code to LocalTerra. Return code ID.
 */
export async function storeCode(
  terra: LocalTerra | LCDClient,
  deployer: Wallet,
  filepath: string,
) {
  const code = fs.readFileSync(filepath).toString('base64');
  const result = await sendTransaction(
    terra,
    deployer,
    [new MsgStoreCode(deployer.key.accAddress, code)],
    false,
  );
  return parseInt(result.logs[0].eventsByType.store_code.code_id[0]);
}

/**
 * @notice Instantiate a contract from an existing code ID. Return contract address.
 */
export async function instantiateContract(
  terra: LocalTerra | LCDClient,
  deployer: Wallet,
  admin: Wallet, // leave this emtpy then contract is not migratable
  codeId: number,
  instantiateMsg: object,
) {
  const result = await sendTransaction(terra, deployer, [
    new MsgInstantiateContract(
      deployer.key.accAddress,
      admin.key.accAddress,
      codeId,
      instantiateMsg,
    ),
  ]);
  return result;
}

/**
 * @notice Return CW20 token balance of the specified account
 */
export async function queryTokenBalance(
  terra: LocalTerra | LCDClient,
  account: string,
  contract: string,
) {
  const balanceResponse = await terra.wasm.contractQuery<{ balance: string }>(
    contract,
    {
      balance: { address: account },
    },
  );
  return balanceResponse.balance;
}

export function loadOrCreateWallet(terra: LCDClient, networkConfig: any) {
  if (!networkConfig.walletMk && !networkConfig.walletRk) {
    const mk = new MnemonicKey();
    const w = terra.wallet(mk);
    console.log(`Generated a new wallet with address ${w.key.accAddress}`);
    networkConfig.walletMk = mk.mnemonic;
    networkConfig.walletAddr = mk.accAddress;
    return [networkConfig, w];
  } else if (networkConfig.walletMk) {
    const mk = new MnemonicKey({
      mnemonic: networkConfig.walletMk,
    });
    const w = terra.wallet(mk);
    console.log(`Using existing wallet with address ${w.key.accAddress}`);
    networkConfig.walletAddr = w.key.accAddress;
    return [networkConfig, w];
  } else {
    const rk = new RawKey(Buffer.from(networkConfig.walletRk, 'hex'));
    const w = terra.wallet(rk);
    console.log(`Using existing wallet with address ${w.key.accAddress}`);
    networkConfig.walletAddr = w.key.accAddress;
    return [networkConfig, w];
  }
}

export async function sendCw20Token(
  terra: LCDClient,
  wallet: Wallet,
  cw20Address: string,
  recipient: string,
  amount: string,
  msg?: any,
) {
  await sendTransaction(terra, wallet, [
    new MsgExecuteContract(wallet.key.accAddress, cw20Address, {
      send: {
        amount: amount,
        contract: recipient,
        msg: msg ? toEncodedBinary(msg) : undefined,
      },
    }),
  ]);
}

export async function transferCw20Token(
  terra: LCDClient,
  wallet: Wallet,
  cw20Address: string,
  recipient: string,
  amount: string,
) {
  await sendTransaction(terra, wallet, [
    new MsgExecuteContract(wallet.key.accAddress, cw20Address, {
      transfer: {
        amount: amount,
        recipient: recipient,
      },
    }),
  ]);
}

interface AssetInfoToken {
  token: {
    contract_addr: string;
  };
}
interface AssetInfoNative {
  native_token: {
    denom: string;
  };
}

export async function setMockOraclePrice(
  terra: LCDClient,
  wallet: Wallet,
  oracleAddr: string,
  assetInfo: AssetInfoToken | AssetInfoNative,
  price: string,
) {
  await sendTransaction(terra, wallet, [
    new MsgExecuteContract(wallet.key.accAddress, oracleAddr, {
      set_price: {
        asset_info: assetInfo,
        price: price,
      },
    }),
  ]);
}

export function getDeploymentConfig(env: string) {
  const configFilePath = `./scripts/${env}.config.json`;
  let networkConfig = JSON.parse(
    fs.readFileSync(configFilePath, {
      encoding: 'utf8',
    }),
  );
  switch (env) {
    case 'localterra':
      let terra = new LocalTerra();
      let wallet: Wallet;
      [networkConfig, wallet] = loadOrCreateWallet(terra, networkConfig);
      return {
        terra,
        wallet,
        networkConfig,
      };
  }
}

export async function deployMessengerContract(
  terra: LCDClient,
  wallet: Wallet,
  networkConfig: any,
) {
  if (!networkConfig.messengerCodeId) {
    const codeId = await storeCode(terra, wallet, './artifacts/messenger.wasm');
    networkConfig.messengerCodeId = codeId;
  }
  if (!networkConfig.messengerAddr) {
    const initContractRes = await instantiateContract(
      terra,
      wallet,
      wallet,
      networkConfig.messengerCodeId,
      {},
    );
    const contractAddr = initContractRes.logs[0].events[0].attributes[3].value;
    networkConfig.messengerAddr = contractAddr;
  }
  return networkConfig;
}

export function saveNetworkConfig(networkConfig: any, env: string) {
  const path = `./scripts/${env}.config.json`;
  fs.writeFileSync(path, JSON.stringify(networkConfig, null, 2));
}
