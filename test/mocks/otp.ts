export const SECRET = 'IYTVQLIRAQDBYPS3OA7CE2Q3OYZVUODJ';

export const MockedOtpService = {
    generateSecret: jest.fn().mockReturnValue(SECRET),
    generateToken: jest.fn(),
    generateKeyUri: jest.fn(),
    verify: jest.fn()
};
