# Friendly Tools - 实现计划（分解和优先级排序任务列表）

## [x] Task 1: API 接口统一规范检查与验证
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 检查所有后端 API 接口是否遵循统一的请求/响应格式
  - 验证成功响应格式：`{"success": true, "data": {...}}`
  - 验证失败响应格式：`{"success": false, "error": "...", "errorCode": 10001}`
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 使用 curl 或 PowerShell 测试每个 API 接口，验证响应格式
  - `human-judgement` TR-1.2: 检查后端代码，确认所有接口使用 `successResponse` 和 `errorResponse` 函数
- **Notes**: 当前后端代码已实现统一响应格式函数，需要验证是否所有接口都使用了这些函数

## [x] Task 2: 修复前端 API 通信问题
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 确保前端 `api.js` 中的 `apiRequest` 函数能够正确处理请求体
  - 修复条件判断，确保当只有 `options` 参数时也能发送 JSON 请求体
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: 测试身份生成 API (`/api/fun/identity`)，验证只有 options 参数时能正常工作
  - `programmatic` TR-2.2: 测试随机密码生成 API (`/api/security/password-generate`)，验证只有 options 参数时能正常工作
- **Notes**: 当前已修复条件判断 `if (options.data !== undefined || options.options !== undefined)`

## [x] Task 3: 添加二级页面返回首页链接
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 为所有二级页面添加"返回首页"导航链接
  - 确保导航链接位置统一，样式一致
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgement` TR-3.1: 检查所有二级 HTML 页面，确认包含返回首页链接
  - `human-judgement` TR-3.2: 手动访问每个二级页面，点击返回首页链接验证功能正常
- **Notes**: 需要检查的页面包括：text-case.html, ascii.html, text-stats.html, text-dedup.html, json-format.html, password-strength.html, password-generate.html, sha256.html, aes.html, morse.html, random-picker.html, identity.html, base-convert.html, exchange-rate.html, unit-convert.html, time-convert.html, color-convert.html, csv-to-json.html, json-to-csv.html, image-convert.html

## [x] Task 4: 修复文本去重功能
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 在 `text-dedup.html` 中添加 `parseSeparator` 函数，正确解析转义字符
  - 确保换行符 `\n`、制表符 `\t`、回车符 `\r` 能够正确处理
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgement` TR-4.1: 在文本去重页面输入多行重复文本，使用换行符分隔，验证去重结果正确
  - `human-judgement` TR-4.2: 测试不同分隔符（换行符、制表符、逗号）的去重功能
- **Notes**: 当前已添加 `parseSeparator` 函数

## [x] Task 5: 验证身份生成功能
- **Priority**: medium
- **Depends On**: Task 2
- **Description**: 
  - 验证身份生成工具页面能够正确调用后端 API
  - 确保生成的身份信息包含所有必填字段（姓名、性别、年龄、电话、邮箱、身份证号、城市、职业）
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-5.1: 调用 `/api/fun/identity` API，验证返回数据结构正确
  - `human-judgement` TR-5.2: 在身份生成页面测试不同参数（数量、性别）的生成结果
- **Notes**: 当前后端 API 已支持 `count` 和 `gender` 参数

## [x] Task 6: 验证随机密码生成功能
- **Priority**: medium
- **Depends On**: Task 2
- **Description**: 
  - 验证随机密码生成工具页面能够正确调用后端 API
  - 确保生成的密码符合指定的长度和字符类型要求
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `programmatic` TR-6.1: 调用 `/api/security/password-generate` API，验证返回数据结构正确
  - `human-judgement` TR-6.2: 在密码生成页面测试不同配置（长度、字符类型、数量）的生成结果
- **Notes**: 当前后端 API 支持 `length`, `count`, `includeLowercase`, `includeUppercase`, `includeNumbers`, `includeSymbols` 参数

## [x] Task 7: 移除"图片处理"板块
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 从 `tools.json` 中移除图片处理工具分类
  - 检查是否有相关页面需要清理
- **Acceptance Criteria Addressed**: None (用户明确要求)
- **Test Requirements**:
  - `human-judgement` TR-7.1: 检查首页，确认图片处理板块已移除
  - `human-judgement` TR-7.2: 检查 `tools.json`，确认图片处理条目已删除
- **Notes**: 当前已从 tools.json 中移除图片处理板块

## [x] Task 8: 优化项目结构和代码质量
- **Priority**: medium
- **Depends On**: Task 1-6
- **Description**: 
  - 将后端路由按功能模块拆分到不同文件
  - 提取公共函数和常量到独立模块
  - 优化代码注释和文档
- **Acceptance Criteria Addressed**: None (非功能需求)
- **Test Requirements**:
  - `human-judgement` TR-8.1: 检查项目结构，确认路由已按模块拆分
  - `programmatic` TR-8.2: 运行测试，确认所有功能正常
- **Notes**: 当前后端所有路由都在 `index.js` 中，建议拆分为多个路由文件

## [ ] Task 9: Vercel 部署验证
- **Priority**: high
- **Depends On**: Task 1-7
- **Description**: 
  - 验证 `vercel.json` 配置正确
  - 确保项目能够成功部署到 Vercel
  - 测试部署后的所有功能是否正常
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `programmatic` TR-9.1: 使用 Vercel CLI 验证项目配置
  - `human-judgement` TR-9.2: 部署后手动测试所有工具功能
- **Notes**: 需要确保使用相对路径，避免绝对路径导致部署问题

## [ ] Task 10: 实现 URL 编码/解码工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/url-encode` 和 `/api/convert/url-decode` API
  - 前端创建 `url-encode.html` 页面，支持编码和解码模式切换
  - 添加到文本工具分类
- **Acceptance Criteria Addressed**: FR-8
- **Test Requirements**:
  - `programmatic` TR-10.1: 调用 URL 编码/解码 API，验证响应格式和结果正确性
  - `human-judgement` TR-10.2: 在页面输入含特殊字符的 URL，验证编码和解码结果正确
- **Notes**: 使用 Node.js 内置 `encodeURIComponent` 和 `decodeURIComponent`

## [ ] Task 11: 实现 Base64 编码/解码工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/base64` API，支持文本和文件的编码解码
  - 前端创建 `base64.html` 页面，支持文本输入和文件上传
  - 添加到转换工具分类
- **Acceptance Criteria Addressed**: FR-9
- **Test Requirements**:
  - `programmatic` TR-11.1: 调用 Base64 API，验证响应格式和编码解码结果正确
  - `human-judgement` TR-11.2: 测试文本编码解码和文件编码解码功能
- **Notes**: 使用 Node.js 内置 Buffer API

## [ ] Task 12: 实现 HTML 实体编码/解码工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/html-entity` API，支持编码和解码
  - 前端创建 `html-entity.html` 页面，支持 HTML 特殊字符处理
  - 添加到文本工具分类
- **Acceptance Criteria Addressed**: FR-10
- **Test Requirements**:
  - `programmatic` TR-12.1: 调用 HTML 实体 API，验证响应格式和结果正确性
  - `human-judgement` TR-12.2: 输入包含 `<>&"` 等特殊字符的文本，验证编码解码结果
- **Notes**: 需要处理常见的 HTML 实体：&lt; &gt; &amp; &quot; &apos;

## [ ] Task 13: 实现 JSON 校验器工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/json-validate` API，验证 JSON 格式并返回错误信息
  - 前端创建 `json-validate.html` 页面，支持 JSON 输入和错误提示
  - 添加到数据工具分类
- **Acceptance Criteria Addressed**: FR-11
- **Test Requirements**:
  - `programmatic` TR-13.1: 调用 JSON 校验 API，验证有效和无效 JSON 的响应
  - `human-judgement` TR-13.2: 输入无效 JSON，验证错误提示信息清晰准确
- **Notes**: 使用 try-catch 包裹 JSON.parse，解析错误时提取错误位置

## [ ] Task 14: 实现 UUID 生成器工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/fun/uuid-generate` API，支持 v1/v4/v5 版本
  - 前端创建 `uuid-generate.html` 页面，支持版本选择和批量生成
  - 添加到趣味工具分类
- **Acceptance Criteria Addressed**: FR-12
- **Test Requirements**:
  - `programmatic` TR-14.1: 调用 UUID API，验证不同版本的 UUID 格式正确
  - `human-judgement` TR-14.2: 测试不同版本 UUID 生成和批量生成功能
- **Notes**: 使用 Node.js 内置 crypto 模块的 randomUUID()

## [ ] Task 15: 实现日期计算器工具
- **Priority**: medium
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/date-calc` API，支持日期差值和工作日计算
  - 前端创建 `date-calc.html` 页面，支持日期选择和计算模式切换
  - 添加到转换工具分类
- **Acceptance Criteria Addressed**: FR-13
- **Test Requirements**:
  - `programmatic` TR-15.1: 调用日期计算 API，验证日期差值和工作日计算结果
  - `human-judgement` TR-15.2: 选择两个日期，验证差值计算和工作日计算正确
- **Notes**: 需要考虑节假日排除（可选功能）

## [ ] Task 16: 实现正则表达式测试器工具
- **Priority**: low
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/convert/regex-test` API，支持正则匹配和分组提取
  - 前端创建 `regex-test.html` 页面，支持正则输入、测试文本输入和匹配结果展示
  - 添加到开发工具分类（新建分类）
- **Acceptance Criteria Addressed**: FR-14
- **Test Requirements**:
  - `programmatic` TR-16.1: 调用正则测试 API，验证匹配结果和分组提取正确
  - `human-judgement` TR-16.2: 输入正则表达式和测试文本，验证匹配结果和高亮显示
- **Notes**: 需要处理正则表达式语法错误，提供友好的错误提示

## [ ] Task 17: 实现 IP 查询工具
- **Priority**: low
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/security/ip-info` API，查询 IP 归属地信息（使用免费 IP API）
  - 前端创建 `ip-info.html` 页面，支持 IP 输入和信息展示
  - 添加到安全工具分类
- **Acceptance Criteria Addressed**: FR-15
- **Test Requirements**:
  - `programmatic` TR-17.1: 调用 IP 查询 API，验证返回数据包含归属地信息
  - `human-judgement` TR-17.2: 输入不同地区的 IP，验证归属地查询结果准确
- **Notes**: 依赖外部 IP 查询 API（如 ip-api.com）

## [ ] Task 18: 实现文件哈希校验工具
- **Priority**: low
- **Depends On**: Task 9
- **Description**: 
  - 后端实现 `/api/security/file-hash` API，支持 MD5/SHA1/SHA256 算法
  - 前端创建 `file-hash.html` 页面，支持文件上传和算法选择
  - 添加到安全工具分类
- **Acceptance Criteria Addressed**: FR-16
- **Test Requirements**:
  - `programmatic` TR-18.1: 调用文件哈希 API，验证不同算法的哈希值正确
  - `human-judgement` TR-18.2: 上传文件，验证不同算法的哈希值计算正确
- **Notes**: 使用 Node.js 内置 crypto 模块的 hash 功能
