package com.blocks.tracker.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.blocks.tracker.data.BlocksRepository
import com.blocks.tracker.data.EntryEntity
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime

class BlocksViewModel(private val repository: BlocksRepository) : ViewModel() {

    private val _currentDate = MutableStateFlow(LocalDate.now().toString())
    val currentDate: StateFlow<String> = _currentDate.asStateFlow()

    val entries: StateFlow<List<EntryEntity>> = _currentDate.flatMapLatest { date ->
        repository.getEntriesForDate(date)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val untitledCount: StateFlow<Int> = _currentDate.flatMapLatest { date ->
        repository.getUntitledCountForDate(date)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val allEntries: StateFlow<List<EntryEntity>> = repository.getAllEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Composer State
    val fromMin = MutableStateFlow(0)
    val toMin = MutableStateFlow(getNowMinutes())
    val isLiveClock = MutableStateFlow(true)
    val activityTitle = MutableStateFlow("")

    // Undo stack
    private var lastUndoSnapshot: List<EntryEntity>? = null
    val undoMessage = MutableStateFlow<String?>(null)

    init {
        // Ticker for live clock
        viewModelScope.launch {
            while (true) {
                if (isLiveClock.value) {
                    toMin.value = getNowMinutes()
                }
                delay(5000)
            }
        }

        // Align fromMin with last entry on date change
        viewModelScope.launch {
            entries.collect { list ->
                if (list.isNotEmpty()) {
                    fromMin.value = list.last().endMin
                } else {
                    fromMin.value = 0
                }
            }
        }

        // Run day auto close at start
        viewModelScope.launch {
            repository.runDayAutoClose(LocalDate.now().minusDays(1).toString())
        }
    }

    private fun getNowMinutes(): Int {
        val now = LocalTime.now()
        return now.hour * 60 + now.minute
    }

    fun addBlock() {
        if (fromMin.value >= toMin.value) return
        val currentSnap = entries.value

        viewModelScope.launch {
            val previous = repository.addEntry(
                date = _currentDate.value,
                fromMin = fromMin.value,
                toMin = toMin.value,
                title = activityTitle.value
            )
            activityTitle.value = ""
            fromMin.value = toMin.value
            isLiveClock.value = true

            // If overlap occurred
            val diff = previous.size - entries.value.size
            if (diff > 0) {
                lastUndoSnapshot = currentSnap
                undoMessage.value = "Trimmed overlapping blocks"
            }
        }
    }

    fun resumeLiveClock() {
        isLiveClock.value = true
        toMin.value = getNowMinutes()
    }

    fun setDate(date: String) {
        _currentDate.value = date
    }

    fun undo() {
        val snap = lastUndoSnapshot ?: return
        viewModelScope.launch {
            repository.restoreEntries(snap, _currentDate.value)
            lastUndoSnapshot = null
            undoMessage.value = null
        }
    }

    fun clearUndoMessage() {
        undoMessage.value = null
    }

    fun deleteEntry(entry: EntryEntity) {
        val snap = entries.value
        viewModelScope.launch {
            repository.deleteEntry(entry)
            lastUndoSnapshot = snap
            undoMessage.value = "Block removed"
        }
    }

    fun updateEdges(target: EntryEntity, newStart: Int, newEnd: Int, newTitle: String) {
        viewModelScope.launch {
            repository.updateEntryEdges(_currentDate.value, target, newStart, newEnd, newTitle)
        }
    }

    fun split(entry: EntryEntity, splitMin: Int) {
        viewModelScope.launch {
            repository.splitEntry(entry, splitMin)
        }
    }

    fun updateTitle(id: String, title: String) {
        viewModelScope.launch {
            repository.updateTitle(id, title)
        }
    }
}
