#!/bin/bash

spotify 1>/dev/null 2>&1 &

sleep 30

qdbus org.mpris.MediaPlayer2.spotify / org.freedesktop.MediaPlayer2.OpenUri spotify:album:0hf0fEpwluYYWwV1OoCWGX