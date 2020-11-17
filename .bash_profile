不配置环境变量的话，执行mysql命令，必须在mysql的安装目录下，所以选择配置环境变量。在终端中，进入到用户目录下，执行 `vim .bash_profile` 或者直接执行`vim ~/.bash_profile` ，按`i`进入编辑模式，添加如下内容，按`esc`，输入`:wq`退出并保存。
```
# mysql
export PATH=${PATH}:/usr/local/mysql/bin
#快速启动、结束MySQL服务, 可以使用alias命令
alias mysqlstart='sudo /usr/local/mysql/support-files/mysql.server start'
alias mysqlstop='sudo /usr/local/mysql/support-files/mysql.server stop'
```
我们就可以在任何地方执行mysql命令了。
- 终端输入`myqsl -u root -p`启动MySQL，安装地址是`/usr/local/mysql`

