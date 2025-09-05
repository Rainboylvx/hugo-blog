# 基于tcp的服务器端/客户端(2)

本章节详细的讲解了TCP 中必要的理论知识


回声客户端问题的解决办法
这个问题其实很容易解决，因为可以提前接受数据的大小。若之前传输了20字节长的字符串，则再接收时循环调用 read 函数读取 20 个字节即可。既然有了解决办法，核心那么代码如下：

```c

//得到发送的数据大小
str_len = write(sockfd,message,sizeof(message));
int recv_len = 0;
while( recv_len < str_len ) {
    int recv_cnt += read(sockfd,recv_buf,str_len-recv_len);
    //对方关闭了连接
    if( recv_cnt == 0 ) {
        break;
    }
    if( recv_cnt < 0 ) {
        error_handing("read error")!
    }
    recv_len += recv_cnt;
}
message[recv_len] = '\0';
printf("Received message: %s\n",message);
```

## TCP 原理

1. TCP socket中的I/O缓冲

1. IO缓冲在每个TCP socket中单独存在.
2. IO缓冲在在创建TCP socket自动生成.
3. 即使关闭socket 也会继续传递输出缓冲中遗留的数据.
4. 关闭socket会丢失输入缓冲中的数据.

> 不会发生超过输入缓冲大小的数据传输!

> write函数会在数据移到输出缓冲时返回.

### 1. TCP连接

3次握手(three-way handshaking)


```
[SYN] SEQ:1000 ACK:NULL
[SYN+ACK] SEQ: 2000, ACK: 1001
[ACK] SEQ: 1001, ACK: 2001
```

### 2. TCP传输

### 3. TCP断开
