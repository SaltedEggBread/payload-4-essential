import * as migration_20261017_160636_initial from './20261017_160636_initial';
import * as migration_20261022_202749_oauth from './20261022_202749_oauth';
import * as migration_20261125_092253_beta12_upgrade from './20261125_092253_beta12_upgrade';

export const migrations = [
  {
    up: migration_20261017_160636_initial.up,
    down: migration_20261017_160636_initial.down,
    name: '20261017_160636_initial',
  },
  {
    up: migration_20261022_202749_oauth.up,
    down: migration_20261022_202749_oauth.down,
    name: '20261022_202749_oauth',
  },
  {
    up: migration_20261125_092253_beta12_upgrade.up,
    down: migration_20261125_092253_beta12_upgrade.down,
    name: '20261125_092253_beta12_upgrade'
  },
];
