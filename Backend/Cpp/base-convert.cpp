#include <iostream>
#include <string>
#include <cstdlib>
#include <cerrno>

using namespace std;

// ==============================================
// 错误输出格式：ERROR : <5位错误码>
// 所有错误码统一在 ErrorMapping.json 中维护
// ==============================================
void errorExit(int code) {
    cerr << "ERROR : " << code << endl;
    exit(code);
}

unsigned long long toDecimal(const string& str, int base) {
    char* end;
    errno = 0;
    unsigned long long value = strtoull(str.c_str(), &end, base);

    if (errno != 0) {
        errorExit(10003);  // 超出范围
    }
    if (*end != '\0') {
        errorExit(10002);  // 非法字符
    }
    return value;
}

string fromDecimal(unsigned long long num, int base) {
    if (num == 0) return "0";
    const char* digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    string result;
    while (num > 0) {
        result = digits[num % base] + result;
        num /= base;
    }
    return result;
}

int main(int argc, char* argv[]) {
    if (argc != 4) {
        errorExit(10001);  // 参数数量错误
    }

    string numStr = argv[1];
    int fromBase = atoi(argv[2]);
    int toBase = atoi(argv[3]);

    if (fromBase < 2 || fromBase > 36) {
        errorExit(10004);
    }
    if (toBase < 2 || toBase > 36) {
        errorExit(10005);
    }
    if (numStr.empty()) {
        errorExit(10006);
    }

    unsigned long long decimal = toDecimal(numStr, fromBase);
    string result = fromDecimal(decimal, toBase);

    cout << result << endl;
    return 0;
}