#include<bits/stdc++.h>

using namespace std;

const int BOARD_SIZE = 111;
const int delta = 30;
const int delta1 = 31;
const int len = 18;
const int len1 = 17;

const int len2 = 10;

void makeBlock(int _x, int _y) {
	printf("{x: %d, y: %d},\n", _x, _y);
}

main() {
	freopen("map1.js", "w", stdout);

	printf("// Map 1 \n\n");
	printf("const BlockBody = [\n");
	
	// block 1
	for(int i = 0; i < len; i ++)	makeBlock(delta, delta + i);
	for(int i = 1; i < len; i ++)	makeBlock(delta + i, delta);
	for(int i = 0; i < len1; i ++)	makeBlock(delta1, delta1 + i);
	for(int i = 1; i < len1; i ++)	makeBlock(delta1 + i, delta1);
	// block 2
	for(int i = 1; i < len; i ++)	makeBlock(BOARD_SIZE - delta - i, delta);
	for(int i = 0; i < len; i ++)	makeBlock(BOARD_SIZE - delta, delta + i);
	for(int i = 1; i < len1; i ++)	makeBlock(BOARD_SIZE - delta1 - i, delta1);
	for(int i = 0; i < len1; i ++)	makeBlock(BOARD_SIZE - delta1, delta1 + i);
		
	// block 3
	for(int i = 0; i < len; i ++)	makeBlock(delta, BOARD_SIZE - delta - i);
	for(int i = 1; i < len; i ++)	makeBlock(delta + i, BOARD_SIZE - delta);
	for(int i = 0; i < len1; i ++)	makeBlock(delta1, BOARD_SIZE - delta1 - i);
	for(int i = 1; i < len1; i ++)	makeBlock(delta1 + i, BOARD_SIZE - delta1);
	
	// block 4

	for(int i = 1; i < len; i ++)	makeBlock(BOARD_SIZE - delta - i, BOARD_SIZE - delta);
	for(int i = 0; i < len; i ++)	makeBlock(BOARD_SIZE - delta, BOARD_SIZE - delta - i);
	for(int i = 1; i < len1; i ++)	makeBlock(BOARD_SIZE - delta1 - i, BOARD_SIZE - delta1);
	for(int i = 0; i < len1; i ++)	makeBlock(BOARD_SIZE - delta1, BOARD_SIZE - delta1 - i);
	
	int x1 = BOARD_SIZE / 3;
	int x2 = BOARD_SIZE / 3 * 2;
	for(int i = 1; i < len; i ++)	makeBlock(x1, i);
	for(int i = 1; i < len; i ++)	makeBlock(x2, i);
	for(int i = 1; i < len; i ++)	makeBlock(x1 - 1, i);
	for(int i = 1; i < len; i ++)	makeBlock(x2 + 1, i);
	for(int i = 0; i < len; i ++)	makeBlock(x1, BOARD_SIZE - i);
	for(int i = 0; i < len; i ++)	makeBlock(x2, BOARD_SIZE - i);
	for(int i = 0; i < len; i ++)	makeBlock(x1 - 1, BOARD_SIZE - i);
	for(int i = 0; i < len; i ++)	makeBlock(x2 + 1, BOARD_SIZE - i);
	
		
	
	printf("]\n");
	system("color a");
}

