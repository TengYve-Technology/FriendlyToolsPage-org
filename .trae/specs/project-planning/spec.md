# Friendly Tools - 项目需求文档

## Overview

- **Summary**: Friendly Tools 是一个面向开发者和日常用户的在线效率工具集，包含文本处理、数据转换、安全工具、趣味工具等多个分类，提供简洁易用的 Web 界面和统一的 RESTful API 接口。
- **Purpose**: 为用户提供一站式的在线工具服务，无需安装软件即可完成常用的数据处理和转换任务，同时为开发者提供标准化的 API 接口用于集成。
- **Target Users**: 开发者、设计师、产品经理、运营人员及日常用户。

## Goals

- [ ] 完善现有工具的功能和用户体验
- [ ] 统一 API 接口规范，确保所有接口遵循一致的请求/响应格式
- [ ] 优化项目结构，提高可维护性和可扩展性
- [ ] 确保项目能够顺利部署到 Vercel
- [ ] 添加缺失的工具功能，丰富工具集（URL编码解码、Base64编码解码、HTML实体编码解码、JSON校验器、UUID生成器、日期计算器、正则表达式测试器、IP查询、文件哈希校验）

## Non-Goals (Out of Scope)

- [ ] 开发移动端原生 APP
- [ ] 实现用户登录/注册系统
- [ ] 添加付费订阅功能
- [ ] 实现复杂的用户权限管理
- [ ] 开发番茄时钟功能

## Background & Context

- 项目采用前后端分离架构，后端使用 Node.js + Express 5.x，前端使用纯 HTML/CSS/JS
- 后端服务于 <http://localhost:3000，前端静态文件由后端> Express 服务托管
- 已实现的工具分类：转换工具、文本处理、安全工具、趣味工具、数据工具
- 已实现的 API 接口超过 20 个，涵盖进制转换、文本处理、密码生成、身份生成等功能
- 已配置 Vercel 部署文件 (`vercel.json`)

## Functional Requirements

- **FR-1**: 所有 API 接口遵循统一的请求格式 `{"data": ..., "options": ...}` 和响应格式 `{"success": true/false, "data/error": ...}`
- **FR-2**: 前端页面能够正确调用后端 API，处理成功和失败响应
- **FR-3**: 所有二级页面包含"返回首页"链接
- **FR-4**: 文本去重工具能够正确处理转义字符（`\n`、`\t`、`\r`）
- **FR-5**: 身份生成工具能够根据参数生成指定数量和性别的虚拟身份
- **FR-6**: 随机密码生成工具能够根据配置生成安全的随机密码
- **FR-7**: 项目能够通过 Vercel 成功部署
- **FR-8**: 实现 URL 编码/解码工具，支持标准编码和解码
- **FR-9**: 实现 Base64 编码/解码工具，支持文本和文件处理
- **FR-10**: 实现 HTML 实体编码/解码工具，处理 HTML 特殊字符
- **FR-11**: 实现 JSON 校验器，验证 JSON 格式并提示错误位置
- **FR-12**: 实现 UUID 生成器，支持 v1/v4/v5 版本
- **FR-13**: 实现日期计算器，支持日期差值计算和工作日计算
- **FR-14**: 实现正则表达式测试器，支持在线测试和调试
- **FR-15**: 实现 IP 查询工具，查询 IP 地址归属地信息
- **FR-16**: 实现文件哈希校验工具，支持 MD5/SHA1/SHA256 算法

## Non-Functional Requirements

- **NFR-1**: API 响应时间 < 1000ms（不含外部 API 调用）
- **NFR-2**: 前端页面加载时间 < 2000ms
- **NFR-3**: 支持 Chrome、Firefox、Safari、Edge 主流浏览器
- **NFR-4**: 响应式设计，支持移动端和桌面端
- **NFR-5**: 使用相对路径，支持 Vercel 部署

## Constraints

- **Technical**:
  - 后端使用 Express 5.x
  - 前端使用纯 HTML/CSS/JS，不使用框架
  - 使用 Node.js 内置模块和指定依赖（cors, jszip, multer, sharp）
- **Business**:
  - 所有工具免费使用
  - 无需数据库，使用 JSON 文件存储配置数据
- **Dependencies**:
  - 汇率转换依赖 Frankfurter API
  - 图片处理依赖 sharp 库

## Assumptions

- [ ] 用户已安装 Node.js 18+ 和 npm
- [ ] 用户了解基本的命令行操作
- [ ] 项目部署环境支持 Node.js 运行时
- [ ] 外部 API（如 Frankfurter）服务可用

## Acceptance Criteria

### AC-1: API 接口统一规范

- **Given**: 调用任意 API 接口
- **When**: 发送 POST 请求，请求体为 `{"data": {...}, "options": {...}}`
- **Then**: 成功响应格式为 `{"success": true, "data": {...}}`，失败响应格式为 `{"success": false, "error": "...", "errorCode": 10001}`
- **Verification**: `programmatic`

### AC-2: 前端与后端通信正常

- **Given**: 打开任意工具页面
- **When**: 执行工具操作（如点击转换按钮）
- **Then**: 页面显示处理结果，不显示"无法连接到后端服务"错误
- **Verification**: `human-judgment`

### AC-3: 返回首页链接

- **Given**: 打开任意二级页面（如 text-case.html）
- **When**: 查看页面内容
- **Then**: 页面包含指向首页的"返回首页"链接或导航按钮
- **Verification**: `human-judgment`

### AC-4: 文本去重功能正确

- **Given**: 打开文本去重页面，输入多行文本，选择换行符作为分隔符
- **When**: 点击去重按钮
- **Then**: 返回去重后的文本，相同内容的行被正确移除
- **Verification**: `human-judgment`

### AC-5: 身份生成功能正确

- **Given**: 打开身份生成页面
- **When**: 设置生成数量和性别，点击生成按钮
- **Then**: 返回指定数量的虚拟身份信息，包含姓名、性别、年龄、电话、邮箱等字段
- **Verification**: `human-judgment`

### AC-6: 随机密码生成功能正确

- **Given**: 打开随机密码生成页面
- **When**: 设置密码长度和字符类型，点击生成按钮
- **Then**: 返回符合要求的随机密码列表
- **Verification**: `human-judgment`

### AC-7: Vercel 部署成功

- **Given**: 在 Vercel 控制台配置项目
- **When**: 触发部署流程
- **Then**: 部署成功完成，网站可访问，所有工具功能正常
- **Verification**: `programmatic`

## Open Questions

- [ ] 是否需要添加新的工具类别或工具？
- [ ] 是否需要添加 API 文档页面？
- [ ] 是否需要添加工具使用统计功能？

