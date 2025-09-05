#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>

#define SERVER_IP "127.0.0.1"
#define SERVER_PORT 8989

void error_handle(char *message)
{
    printf("error: %s\n", message);
}

int main()
{
    // 创建一个client 端的socket
    //  man 7 socket, man 2 socket
    int clnt_sock = socket(AF_INET, SOCK_STREAM, 0);
    if (clnt_sock == -1)
    {
        error_handle("socket() failed!");
        return 1;
    }

    // 连接到服务器
    struct sockaddr_in clnt_addr;
    memset(&clnt_addr, 0, sizeof(clnt_addr));
    clnt_addr.sin_family = AF_INET;
    //inet_addr man 7 ip
    clnt_addr.sin_addr.s_addr = inet_addr(SERVER_IP);
    clnt_addr.sin_port = htons(SERVER_PORT);
    if (connect(clnt_sock, (struct sockaddr *)&clnt_addr, sizeof(clnt_addr)) == -1)
    {
        error_handle("connect() failed!");
        return 1;
    }
    // 发送数据
    // send(clnt_sock, message, sizeof(message), 0);
    // 接收数据
    char buffer[1024];
    int str_len = read(clnt_sock, buffer, sizeof(buffer) - 1);
    if (str_len == -1)
    {
        error_handle("read() failed!");
        return 1;
    }
    else
    {
        buffer[str_len] = '\0';
        printf("Message from server: %s\n", buffer);
    }
    close(clnt_sock);
    return 0;
}
