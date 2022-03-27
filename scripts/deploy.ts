import {
  deployMessengerContract,
  getDeploymentConfig,
  saveNetworkConfig,
} from './helpers';

const ENV = 'localterra';

(async () => {
  const { terra, networkConfig, wallet } = getDeploymentConfig(ENV);
  await deployMessengerContract(terra, wallet, networkConfig);
  console.log(networkConfig);
  saveNetworkConfig(networkConfig, ENV);
})();
