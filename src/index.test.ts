import { GTag } from './index';

test('GTag', async () => {
  const argsList: any[] = [];

  let wait = 25;

  const tag = new GTag(
    (...args): void => {
      argsList.push(args);
      const cb = args[2] && (args[2] as any).event_callback;
      if (cb) {
        setTimeout(cb, wait);
      }
    },
    'TID',
    {
      eventTimeout: 500,
    }
  );

  tag.init(false, {
    app_id: 'APP_ID',
    app_installer_id: 'APP_INS_ID',
    app_name: 'APP_NAME',
    app_version: 'APP_VERSION',
  });

  expect(argsList[0][0]).toEqual('js');
  expect(argsList[0][1]).toBeInstanceOf(Date);

  expect(argsList.slice(1)).toEqual([
    [
      'config',
      'TID',
      {
        send_page_view: false,
      },
    ],
    [
      'config',
      'TID',
      {
        app_id: 'APP_ID',
        app_installer_id: 'APP_INS_ID',
        app_name: 'APP_NAME',
        app_version: 'APP_VERSION',
      },
    ],
  ]);

  await tag.sendEvent('login', 'engagement', 'method', { value: 3 });
  delete argsList[argsList.length - 1][2].event_callback;
  expect(argsList[argsList.length - 1]).toEqual([
    'event',
    'login',
    {
      event_category: 'engagement',
      event_label: 'method',
      value: 3,
    },
  ]);

  wait = 1000;
  expect(
    tag.sendEvent('login', 'engagement', 'method', { value: 3 })
  ).rejects.toThrowError('timeout');

  wait = 10;
  expect(
    tag.sendEvent('login', 'engagement', 'method', { value: 3 })
  ).resolves.toBe(undefined);
});
