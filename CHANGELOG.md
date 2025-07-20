# 更新日志

所有重要的项目变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0]

### 🎉 首次正式发布
- 📝 **完整的Markdown支持**: 自动将Markdown文件转换为微信公众号格式
- 🖼️ **智能图片处理**: 自动上传本地图片和网络图片到微信素材库
- 🔄 **自动令牌管理**: 自动获取和刷新微信access_token，支持stable_token接口
- 👥 **多公众号支持**: 按AppID区分token缓存，避免不同公众号之间的冲突
- 🎨 **主题系统**: 内置多种主题，支持自定义样式
- 🔌 **插件系统**: 可扩展的插件架构，支持自定义处理逻辑
- 📦 **CLI工具**: 完整的命令行界面，支持全局安装和npx使用
- 🤖 **MCP服务器**: 支持Model Context Protocol，为AI助手提供微信发布能力
- 🌐 **网络图片支持**: 支持通过URL上传封面图片和文章图片
- 🛡️ **完善的错误处理**: 详细的错误处理和日志记录

### 📋 核心功能
- Markdown语法支持（标题、段落、列表、代码块、表格、引用等）
- 本地图片和网络图片自动处理和上传
- 多种内置主题（default、juejin、zhihu、wechat等）
- 自动token管理和缓存
- 文章预览功能
- 草稿箱发布
- 完整的CLI命令集
- MCP协议集成

### 🔧 技术特性
- TypeScript编写，类型安全
- 模块化架构，易于扩展
- 完善的错误处理机制
- 自动资源清理
- 跨平台支持

---

## 版本说明

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

## 贡献指南

如果你想为这个项目做出贡献，请：

1. Fork 这个仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

感谢所有贡献者的努力！🙏