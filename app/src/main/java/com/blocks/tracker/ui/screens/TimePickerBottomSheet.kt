package com.blocks.tracker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.blocks.tracker.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimePickerBottomSheet(
    initialMinutes: Int,
    label: String,
    onDismiss: () -> Unit,
    onTimeSelected: (Int) -> Unit
) {
    var selectedHour by remember { mutableIntOf((initialMinutes / 60).coerceIn(0, 23)) }
    var selectedMinute by remember { mutableIntOf((initialMinutes % 60).coerceIn(0, 59)) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = PaperSurfaceSheet,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 12.dp)
                    .width(36.dp)
                    .height(4.dp)
                    .background(PaperDivider, RoundedCornerShape(2.dp))
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Adjust $label",
                style = MaterialTheme.typography.bodySmall,
                color = InkSecondary,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Two Scrolling Wheels
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Hour Wheel
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = String.format("%02d", (selectedHour - 1 + 24) % 24),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedHour = (selectedHour - 1 + 24) % 24
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                    Text(
                        text = String.format("%02d", selectedHour),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp),
                        color = InkPrimary
                    )
                    Text(
                        text = String.format("%02d", (selectedHour + 1) % 24),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedHour = (selectedHour + 1) % 24
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                }

                Text(
                    text = ":",
                    style = MaterialTheme.typography.displayLarge,
                    color = InkPrimary,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )

                // Minute Wheel
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = String.format("%02d", (selectedMinute - 1 + 60) % 60),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedMinute = (selectedMinute - 1 + 60) % 60
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                    Text(
                        text = String.format("%02d", selectedMinute),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp),
                        color = InkPrimary
                    )
                    Text(
                        text = String.format("%02d", (selectedMinute + 1) % 60),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 36.sp),
                        color = InkPrimary.copy(alpha = 0.3f),
                        modifier = Modifier.clickable {
                            selectedMinute = (selectedMinute + 1) % 60
                            onTimeSelected(selectedHour * 60 + selectedMinute)
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = PaperContainer),
                shape = RoundedCornerShape(9999.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text(text = "Done", color = InkPrimary)
            }
        }
    }
}
