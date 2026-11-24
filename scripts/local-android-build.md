# Windows 本地 APK 打包流程（Cursor 适用）

本文适用于 `D:\e确镜\e-confirm-app`。项目源目录可以保留中文名称，**不需要改名**；但 Android 的 Expo/Gradle 构建必须在独立的英文路径副本中进行。

## 为什么 Cursor 会报错

不要在下面两种路径中构建：

```text
D:\e确镜\e-confirm-app
C:\e-confirm-app   （指向源目录的 junction / 符号链接）
```

Expo 自动链接和 Android Gradle 会解析链接的真实路径，最终仍使用 `D:\e确镜`。常见错误包括：

- `Included build ... @react-native\gradle-plugin does not exist`
- `JdkImageTransform` / `core-for-system-modules.jar` / `jlink.exe` 失败
- 原生库链接时提示 `libreact_codegen_*.so` 不存在

最后一种通常是两个 Gradle 构建同时写同一份 `android\app\.cxx` 中间目录造成的竞态；同一时刻只能运行一个构建命令。

## 一次性前提

1. Android SDK 已安装到 `%LOCALAPPDATA%\Android\Sdk`，包括 Android SDK Platform 36、Build Tools 36.0.0、NDK 27.1.12297006 和 CMake 3.22.1。
2. 安装 JDK 17。不要使用 Android Studio 自带的 Java 25。
3. 关闭 Cursor 中正在运行的 Gradle/Expo 打包任务，再开始以下流程。

## 1. 创建独立英文构建副本

在 **PowerShell** 执行。此命令只同步到 `C:\e-confirm-build` 临时目录，不会修改源目录。

```powershell
$source = 'D:\e确镜\e-confirm-app'
$build = 'C:\e-confirm-build'

robocopy $source $build /MIR /XD node_modules android .expo .git dist
if ($LASTEXITCODE -gt 7) {
  throw "复制构建副本失败，robocopy exit code: $LASTEXITCODE"
}

Set-Location $build
npm.cmd ci
npx.cmd expo prebuild --platform android --clean --no-install
```

每次源代码、`app.json`、图标或依赖发生变化后，都重新执行本节，再打包。

## 2. 配置当前终端的 Android 环境

将 `$jdk17` 改成你机器中实际的 JDK 17 目录。以下命令只作用于当前 PowerShell 窗口。

```powershell
$jdk17 = "$env:USERPROFILE\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
$env:JAVA_HOME = $jdk17
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

& "$env:JAVA_HOME\bin\java.exe" -version
```

输出必须是 Java 17。

## 3. 仅在出现 `jlink` DLL 拒绝访问错误时使用的兼容 JDK

如果 Cursor 日志含有 `JdkImageTransform`、`core-for-system-modules.jar`、`jlink.exe` 或 `ucrtbase.dll AccessDeniedException`，创建一个临时 JDK 副本，并让 `jlink` 自动追加 `--strip-native-commands`。这个参数生成的镜像仍可供 Android Java 编译使用，同时避开 Windows 对 `ucrtbase.dll` 的拦截。

```powershell
$originalJdk = "$env:USERPROFILE\.gradle\jdks\eclipse_adoptium-17-amd64-windows.2"
$compatJdk = 'C:\jdk17-gradle-strip'

robocopy $originalJdk $compatJdk /E /NFL /NDL /NJH /NJS /NC /NS
if ($LASTEXITCODE -gt 7) { throw "复制 JDK 失败：$LASTEXITCODE" }

Move-Item "$compatJdk\bin\jlink.exe" "$compatJdk\bin\jlink-real.exe" -Force
@'
using System;
using System.Diagnostics;
using System.Linq;
public static class JlinkWrapper {
  static string Q(string v) { return "\"" + v.Replace("\"", "\\\"") + "\""; }
  public static int Main(string[] args) {
    var p = new Process();
    p.StartInfo.FileName = @"C:\jdk17-gradle-strip\bin\jlink-real.exe";
    p.StartInfo.UseShellExecute = false;
    p.StartInfo.Arguments = "--strip-native-commands " + string.Join(" ", args.Select(Q));
    p.Start(); p.WaitForExit(); return p.ExitCode;
  }
}
'@ | Set-Content 'C:\e-confirm-build\JlinkWrapper.cs' -Encoding ascii

& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' /nologo /optimize+ `
  /out:"$compatJdk\bin\jlink.exe" 'C:\e-confirm-build\JlinkWrapper.cs'

$env:JAVA_HOME = $compatJdk
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

如果 `C:\jdk17-gradle-strip` 已经存在，先确认它是临时构建目录后删除，再重新执行本节，避免覆盖不明文件。

## 4. 验证图标并打包

只打开一个 PowerShell 或一个 Cursor 终端，依次执行：

```powershell
Set-Location C:\e-confirm-build
npm.cmd run verify:launcher-icons

Set-Location .\android
.\gradlew.bat :app:externalNativeBuildCleanRelease --no-daemon --max-workers=1 --console=plain
.\gradlew.bat assembleRelease --no-daemon --max-workers=1 --console=plain
```

`--max-workers=1` 用来避免 React Native 原生库并行抢写而导致 `libreact_codegen_*.so` 丢失。

## 5. 获取并验证 APK

成功后 APK 位于：

```text
C:\e-confirm-build\android\app\build\outputs\apk\release\app-release.apk
```

本项目当前验证命令：

```powershell
$apk = 'C:\e-confirm-build\android\app\build\outputs\apk\release\app-release.apk'
$tools = "$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0"

& "$tools\aapt.exe" dump badging $apk
& "$tools\apksigner.bat" verify --verbose $apk
```

预期信息：

- 包名：`com.hospital.econfirm`
- 版本：`1.0.0`，`versionCode 10`
- 启动图标：蓝色背景、透明 `e + 盾牌` 前景、单色图层；应用内 `BrandLogo` 不受影响。

当前 Release APK 使用本机 Android Debug 证书签名，适合安装测试。提交应用商店或覆盖正式签名安装包前，需要配置正式 keystore。

## 不要使用的命令

在 Windows 上不要使用：

```powershell
eas build --local
```

EAS 本地构建要求 macOS 或 Linux。Windows 请使用本文的 `expo prebuild + gradlew assembleRelease` 流程。
