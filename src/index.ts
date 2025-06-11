import { NativeModules, Platform } from 'react-native';

const { RNNaverLogin } = NativeModules;

const printWarning = (message: string) => {
  console.warn(`['RNNaverLogin'] ${message}`);
};

export interface NaverLoginInitParams {
  consumerKey: string;
  consumerSecret: string;
  appName: string;
  /** (iOS) 네이버앱을 사용하는 인증을 비활성화 한다. (default: false) */
  disableNaverAppAuthIOS?: boolean;
  /** (iOS) Info.plist의 서비스에서 설정한 URL Type의 Schemes */
  serviceUrlSchemeIOS?: string;
}
export interface NaverLoginResponse {
  isSuccess: boolean;
  /** isSuccess가 true일 때 존재합니다. */
  successResponse?: {
    accessToken: string;
    refreshToken: string;
    expiresAtUnixSecondString: string;
    tokenType: string;
  };
  /** isSuccess가 false일 때 존재합니다. */
  failureResponse?: {
    message: string;
    isCancel: boolean;

    /** Android Only */
    lastErrorCodeFromNaverSDK?: string;
    /** Android Only */
    lastErrorDescriptionFromNaverSDK?: string;
  };
}

const initialize = ({
  appName,
  consumerKey,
  consumerSecret,
  disableNaverAppAuthIOS = false,
  serviceUrlSchemeIOS = '',
}: NaverLoginInitParams) => {
  if (Platform.OS === 'ios') {
    if (!serviceUrlSchemeIOS) {
      printWarning('serviceUrlSchemeIOS is missing in iOS initialize.');
      return;
    }
    RNNaverLogin.initialize(
      serviceUrlSchemeIOS,
      consumerKey,
      consumerSecret,
      appName,
      disableNaverAppAuthIOS
    );
  } else if (Platform.OS === 'android') {
    RNNaverLogin.initialize(consumerKey, consumerSecret, appName);
  }
};

const login = (): Promise<NaverLoginResponse> => {
  return RNNaverLogin.login();
};

const logout = async (): Promise<void> => {
  await RNNaverLogin.logout();
};

const deleteToken = async (): Promise<void> => {
  await RNNaverLogin.deleteToken();
};

export interface GetProfileResponse {
  resultcode: string;
  message: string;
  response: {
    id: string;
    profile_image: string | null;
    email: string;
    name: string;
    birthday: string | null;
    age: string | null;
    birthyear: number | null;
    gender: string | null;
    mobile: string | null;
    mobile_e164: string | null;
    nickname: string | null;
  };
}

export interface NaverApiError {
  timestamp: number;
  status: number;
  error: string;
  path: string;
}

const handleNaverApiResponse = async (response: Response) => {
  if (!response.ok) {
    try {
      throw await response.json();
    } catch (error) {
      throw {
        timestamp: Date.now(),
        status: response.status,
        error: `네이버 API 호출 실패 (${response.status})`,
        path: response.url,
      } satisfies NaverApiError;
    }
  }

  return response.json();
};

const getProfile = async (token: string): Promise<GetProfileResponse> => {
  const response = await fetch('https://openapi.naver.com/v1/nid/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await handleNaverApiResponse(response);
};

export interface AgreementInfo {
  termCode: string;
  clientId: string;
  agreeDate: string;
}

export interface GetAgreementResponse {
  result: string;
  accessToken: string;
  agreementInfos: AgreementInfo[];
}

const getAgreement = async (token: string): Promise<GetAgreementResponse> => {
  const response = await fetch('https://openapi.naver.com/v1/nid/agreement', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleNaverApiResponse(response);
};

const NaverLogin = {
  initialize,
  login,
  logout,
  deleteToken,
  getProfile,
  getAgreement,
};
export default NaverLogin;
