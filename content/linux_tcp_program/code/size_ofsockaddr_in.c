#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h> /* superset of previous */

int main (int argc, char *argv[]) {
    printf("size bytes of sockaddr_in %ld\n",sizeof(struct sockaddr_in));
    printf("size bytes of sin_family %ld\n",sizeof(sa_family_t));
    printf("size bytes of sin_port %ld\n",sizeof(in_port_t));
    printf("size bytes of sin_addr %ld\n",sizeof(struct in_addr));
    return 0;
}
