property appTitle : "蒲公英采集助手"
property pgyUrl : "https://pgy.xiaohongshu.com/solar/pre-trade/note/kol"

on run
	set choices to {"安装/更新插件", "打开蒲公英后台", "打开插件文件夹", "复制插件文件夹路径", "查看使用说明", "退出"}
	set picked to choose from list choices with title appTitle with prompt "请选择要做的事情：" default items {"安装/更新插件"} OK button name "继续" cancel button name "退出"
	if picked is false then return
	set actionName to item 1 of picked

	if actionName is "安装/更新插件" then
		installOrUpdate()
	else if actionName is "打开蒲公英后台" then
		openChromeUrl(pgyUrl)
	else if actionName is "打开插件文件夹" then
		openExtensionFolder()
	else if actionName is "复制插件文件夹路径" then
		copyExtensionPath()
	else if actionName is "查看使用说明" then
		openReadme()
	end if
end run

on installOrUpdate()
	set folderPath to extensionFolderPath()
	set the clipboard to folderPath
	openChromeUrl("chrome://extensions/")
	openExtensionFolder()
	display dialog "已打开 Chrome 扩展管理页，并复制插件文件夹路径。" & return & return & "请在 Chrome 页面里：" & return & "1. 打开右上角“开发者模式”" & return & "2. 点击“加载已解压的扩展程序”" & return & "3. 选择刚刚打开的 pgy-kol-collector 文件夹" & return & return & "如果是更新版本，请点击扩展卡片上的“重新加载”，然后刷新蒲公英页面。" buttons {"知道了"} default button "知道了" with title appTitle
end installOrUpdate

on openChromeUrl(targetUrl)
	tell application "Google Chrome"
		activate
		if (count of windows) is 0 then
			make new window
		end if
		set URL of active tab of front window to targetUrl
	end tell
end openChromeUrl

on openExtensionFolder()
	set folderPath to extensionFolderPath()
	do shell script "open " & quoted form of folderPath
end openExtensionFolder

on copyExtensionPath()
	set folderPath to extensionFolderPath()
	set the clipboard to folderPath
	display dialog "插件文件夹路径已复制。" & return & return & folderPath buttons {"知道了"} default button "知道了" with title appTitle
end copyExtensionPath

on openReadme()
	set readmePath to extensionFolderPath() & "/README.md"
	do shell script "open " & quoted form of readmePath
end openReadme

on extensionFolderPath()
	set appPath to POSIX path of (path to me)
	set parentPath to do shell script "dirname " & quoted form of appPath
	return parentPath & "/pgy-kol-collector"
end extensionFolderPath
