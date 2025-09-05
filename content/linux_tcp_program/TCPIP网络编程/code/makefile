CC = gcc
CFLAGS = -Wall -std=c11
SRCS := $(wildcard *.c)
PROGS := $(SRCS:.c=.out)

all: $(PROGS)
	@echo "all done!"

%.out: %.c
	$(CC) $(CFLAGS) -o $@ $<

clean:
	rm -f $(PROGS)
