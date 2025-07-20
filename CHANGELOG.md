# 更新日志

所有重要的项目变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.3]

### 🐛 关键修复
- 🔧 **修复npx命令问题**: 修正package.json中bin路径配置，解决npx无法启动MCP服务器的问题
- ✨ **确保MCP服务器可用**: 现在可以通过npx正常启动MCP服务器

## [1.0.2]

### 🐛 问题修复
- 🔧 **修复MCP服务器路径问题**: 解决CLI中package.json路径错误导致的启动失败
- 🛠️ **删除重复命令**: 移除CLI中重复的mcp-info命令定义
- ✨ **优化MCP服务器**: 确保所有MCP命令都能正常工作
- 📋 **完善错误处理**: 改进CLI命令的错误处理和日志输出

### 📚 文档更新
- 📖 添加GitHub仓库链接和徽章
- 🔧 更新README中的项目信息和贡献指南

## [1.0.1]

### 📚 文档更新
- 📖 添加GitHub仓库信息和链接
- 🎨 美化README，添加npm和GitHub徽章
- 🤝 完善贡献指南和支持信息

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