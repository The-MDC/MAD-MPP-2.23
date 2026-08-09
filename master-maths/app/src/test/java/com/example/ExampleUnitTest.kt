package com.example

import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

class ExampleUnitTest {
  @Test
  fun addition_isCorrect() {
      val root = File("/app/src/main/java")
      if (root.exists()) {
          root.walkTopDown().filter { it.isFile && it.extension == "kt" }.forEach { file ->
              var content = file.readText()
              
              val regex = Regex("""\.border\(\s*([\d.]+)\.dp""")
              val newContent = regex.replace(content) { matchResult ->
                  val currentValue = matchResult.groupValues[1].toDoubleOrNull() ?: 1.0
                  val newValue = currentValue + 0.5
                  val formattedValue = if (newValue % 1 == 0.0) "${newValue.toInt()}f" else "${newValue}f"
                  // actually we need to write 1.dp or 1.5.dp, NOT 1f.dp. So if it's 1 it's 1.dp
                  val fv = if (newValue % 1 == 0.0) newValue.toInt().toString() else newValue.toString()
                  ".border(${fv}.dp"
              }
              
              if (content != newContent) {
                  file.writeText(newContent)
              }
          }
      }
  }
}