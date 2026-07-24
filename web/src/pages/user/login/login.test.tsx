// @ts-ignore
import { startMock } from '@@/requestRecordMock';
import { TestBrowser } from '@@/testBrowser';
import { fireEvent, render } from '@testing-library/react';
import React, { act } from 'react';

let server: {
  close: () => void;
};

describe('Login Page', () => {
  beforeAll(async () => {
    server = await startMock({
      port: 8000,
      scene: 'login',
    });
  });

  afterAll(() => {
    server?.close();
  });

  it('should show login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('go-ant-design-pro-admin');

    act(() => {
      historyRef.current?.push('/user/login');
    });

    expect(
      rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')
        ?.textContent,
    ).toBe('后台管理框架模板');

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });

  it('should login success', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('go-ant-design-pro-admin');

    const userNameInput = await rootContainer.findByPlaceholderText('用户名');

    act(() => {
      fireEvent.change(userNameInput, { target: { value: 'admin' } });
    });

    const passwordInput = await rootContainer.findByPlaceholderText('密码');

    act(() => {
      fireEvent.change(passwordInput, { target: { value: 'ant.design' } });
    });

    await (await rootContainer.findByText('Login')).click();

    // Wait for login to succeed and navigate to home page
    await rootContainer.findByText(/go-ant-design-pro-admin/, undefined, {
      timeout: 10000,
    });

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });
});
