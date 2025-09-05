# socket类型与协议设置

下我只与我理解的内容,如果全部都写,那么就变在了抄书了.

```
int socket(int domain, int type, int protocol);
```
其中的`domain`参数指定协议族,常见的有AF_INET, AF_INET6, AF_UNIX等,分别对应IPv4, IPv6, Unix Domain Socket.

`type`参数指定socket类型,常见的有SOCK_STREAM, SOCK_DGRAM, SOCK_RAW, SOCK_SEQPACKET等,分别对应TCP流式socket, UDP数据报式socket, 原始套接字, 顺序包套接字等.

`protocol`参数指定协议,常见的有IPPROTO_TCP, IPPROTO_UDP, IPPROTO_RAW, IPPROTO_SCTP等,分别对应TCP, UDP, 原始协议, SCTP等.

一般情况下,我们只需要设置`domain`和`type`参数,因为`protocol`参数一般由系统自动设置.

例如,创建一个TCP流式socket,可以使用如下代码:

这个用到的最多,其实也只用到这个(我们自己写的简单代码).
```
int sockfd = socket(AF_INET, SOCK_STREAM, 0);
```

创建一个UDP数据报式socket,可以使用如下代码:

```
int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
```

创建一个原始套接字,可以使用如下代码:

```
int sockfd = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);
```

## 传输的数据不存在数据边界

书上告诉我们,socket数据的传输是无边界的,也就是说,我们发送的数据可能被拆分成多个包,也可能被粘包,接收方也可能一次接收多个包,这取决于网络的传输速率和接收方处理能力.


这里给出一个我根据书上写的`client.c`代码,用来接收TCP流式socket数据:

它一次只能读取一个字节.

```c
int tot = 0;
int read_len;
char buf[1024]
while(1) {
    //一次读取一个字节
    read_len = read(sockfd, buf, 1);
    if( read_len == -1) break;
    //输出读取的字符
    printf("%c",buf[0]);
    tot += read_len;
}
```