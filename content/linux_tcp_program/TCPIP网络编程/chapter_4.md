# 基于tcp的服务器端/客户端

详细的内容看这里,我就不复制了:

https://github.com/riba2534/TCP-IP-NetworkNote/blob/master/ch04/README.md

![](https://camo.githubusercontent.com/270414295465a1c9e1cbd2f105bbd31b2d146d9282b431a8ab53aa369bfd137c/68747470733a2f2f692e6c6f6c692e6e65742f323031392f30312f31342f356333633231383839646230362e706e67)

TCP/IP 协议栈共分为 4 层，可以理解为数据收发分成了 4 个层次化过程，通过层次化的方式来解决问题

+ 链路层: 物理层,负责网络设备之间的通信，如网卡、网线等
+ IP层: 数据包进行中线选择
+ TCP/UDP层: 负责数据包的传输，保证数据包的可靠性和顺序性

##  实现基于 TCP 的服务器/客户端


![](https://camo.githubusercontent.com/69fcf57d2971b632de8b50baeab7039cd018c607363fc5c4f8c80f532362a5db/68747470733a2f2f692e6c6f6c692e6e65742f323031392f30312f31342f356333633237383261373831302e706e67)

![](https://camo.githubusercontent.com/2ded080eac322e985c4cd748055c169e7e832905497d93d0949fa45c08b69bfb/68747470733a2f2f692e6c6f6c692e6e65742f323031392f30312f31342f356333633331643737653836632e706e67)

## 代码: 
hello_server

```c
{{#include ch04/hello_server.c}}
```

代码: hello_client

```c
{{#include ch04/hello_client.c}}
```

## echo服务器/客户端

程序运行的基本方式：

-   服务器端在同一时刻只与一个客户端相连，并提供回声服务。
-   服务器端依次向 5 个客户端提供服务并退出。`for`循环5次
-   客户端接受用户输入的字符串并发送到服务器端。
-   服务器端将接受的字符串数据传回客户端，即「回声」
-   服务器端与客户端之间的字符串回声一直执行到客户端输入 Q 为止。


```c
{{#include ch04/echo_server.c}}
```

```c
{{#include ch04/echo_client.c}}
```
  

## FAQ

问: 我在在linux下使用socket进行tcp网络编程,如果client端调用了close(sock)函数,那么server端口的read函数会读取到什么?

答:


在Linux下使用socket进行TCP网络编程时,如果客户端调用了`close(sock)`函数,服务器端的`read`函数的行为取决于客户端关闭连接的方式和时机。

通常情况下,当客户端调用`close(sock)`函数时,会向服务器发送一个FIN包,表示客户端想要关闭连接。服务器收到FIN包后,会做出以下响应:

1. 如果服务器已经读取了所有客户端发送的数据,那么`read`函数会返回0,表示已经到达文件末尾(EOF)。这意味着客户端已经关闭了连接,并且没有更多的数据可读。

2. 如果服务器还没有读取完客户端发送的所有数据,那么`read`函数会继续读取剩余的数据,直到读取完所有数据或者遇到错误为止。在这种情况下,`read`函数会返回实际读取到的字节数。当所有数据读取完毕后,再次调用`read`函数会返回0,表示已经到达文件末尾(EOF)。

3. 如果客户端在发送数据的过程中突然关闭了连接,那么服务器的`read`函数可能会返回一个错误,通常是`ECONNRESET`错误,表示连接被重置。

需要注意的是,如果客户端在关闭连接之前没有发送所有的数据,那么服务器可能会丢失一部分数据。为了确保数据的完整性,通常建议在关闭连接之前,先调用`shutdown(sock, SHUT_WR)`函数,告诉操作系统不再发送数据,然后再调用`close(sock)`函数关闭连接。

总之,服务器端的`read`函数在客户端关闭连接时的行为取决于具体的情况:
- 如果客户端发送了所有数据并关闭连接,`read`函数会返回0,表示EOF。
- 如果客户端关闭连接时还有未读取的数据,`read`函数会继续读取剩余数据,直到读取完毕,然后返回0,表示EOF。
- 如果客户端异常关闭连接,`read`函数可能会返回错误,如`ECONNRESET`。

作为服务器端,需要正确处理这些不同的情况,以确保程序的正确性和鲁棒性。


问: 如何检测到 read函数返回一个错误, 例如是ECONNRESET?



在Linux系统中,当`read`函数返回错误时,会设置全局变量`errno`来指示具体的错误类型。你可以通过检查`errno`的值来判断是否发生了`ECONNRESET`错误。

下面是一个示例代码,演示了如何检测`read`函数返回的错误:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>

ssize_t read_data(int sockfd, void *buf, size_t len) {
    ssize_t num_read = read(sockfd, buf, len);
    if (num_read == -1) {
        if (errno == ECONNRESET) {
            printf("Connection reset by peer\n");
        } else {
            perror("read");
        }
        return -1;
    }
    return num_read;
}
```



在上面的代码中,`read_data`函数封装了`read`函数的调用。它检查`read`函数的返回值:
- 如果返回值为-1,表示发生了错误。此时,通过检查`errno`的值来判断具体的错误类型:
  - 如果`errno`的值等于`ECONNRESET`,表示连接被对端重置,可以输出相应的错误信息。
  - 否则,可以使用`perror`函数输出错误信息,`perror`函数会根据`errno`的值自动生成对应的错误描述。
- 如果返回值不为-1,表示读取成功,函数返回实际读取到的字节数。

在实际使用时,你可以根据需要对`read_data`函数进行调用,并根据返回值进行相应的处理:

```c
char buffer[1024];
ssize_t num_read = read_data(sockfd, buffer, sizeof(buffer));
if (num_read == -1) {
    // 处理错误情况
} else if (num_read == 0) {
    // 处理连接关闭的情况
} else {
    // 处理成功读取数据的情况
}
```

通过检查`read_data`函数的返回值,你可以判断是否发生了错误,并根据具体的错误类型采取相应的处理措施。

总之,通过检查`read`函数的返回值和`errno`的值,你可以检测并处理`read`函数返回的错误,包括`ECONNRESET`错误。这样可以增强程序的健壮性和可靠性。