#!/bin/sh
find app/src/main/java -name "*.kt" -type f -exec sed -i "s/RoundedCornerShape([0-9]*\.dp)/androidx.compose.foundation.shape.CutCornerShape(2.dp)/g" {} +
find app/src/main/java -name "*.kt" -type f -exec sed -i "s/RoundedCornerShape(topStart = [0-9]*\.dp, bottomStart = [0-9]*\.dp)/androidx.compose.foundation.shape.CutCornerShape(topStart = 2.dp, bottomStart = 2.dp)/g" {} +
find app/src/main/java -name "*.kt" -type f -exec sed -i "s/RoundedCornerShape(topStart = [0-9]*\.dp, topEnd = [0-9]*\.dp)/androidx.compose.foundation.shape.CutCornerShape(topStart = 2.dp, topEnd = 2.dp)/g" {} +
find app/src/main/java -name "*.kt" -type f -exec sed -i "s/RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)/androidx.compose.foundation.shape.CutCornerShape(2.dp)/g" {} +
find app/src/main/java -name "*.kt" -type f -exec sed -i "s/\.shadow([^)]*)//g" {} +
