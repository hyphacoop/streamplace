package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"stream.place/streamplace/pkg/rtcrec"
)

func main() {
	err := Start()
	if err != nil {
		log.Fatal(err)
	}
}

func Start() error {
	if len(os.Args) > 1 && os.Args[1] == "decode" {
		return Decode()
	}
	if len(os.Args) > 1 && os.Args[1] == "trim" {
		return Trim()
	}
	return fmt.Errorf("unknown command: %s", os.Args[1])
}

func Trim() error {
	var duration time.Duration
	flag.DurationVar(&duration, "duration", 0, "duration to trim off the front")
	var inPath string
	flag.StringVar(&inPath, "in-path", "", "path to the file to decode")
	var outPath string
	flag.StringVar(&outPath, "out-path", "", "path to the file to write the trimmed file to")
	err := flag.CommandLine.Parse(os.Args[2:])
	if err != nil {
		return err
	}
	if duration == 0 {
		return fmt.Errorf("duration is required")
	}
	if inPath == "" {
		return fmt.Errorf("in-path is required")
	}
	if outPath == "" {
		return fmt.Errorf("out-path is required")
	}
	inFile, err := os.Open(inPath)
	if err != nil {
		return err
	}
	defer inFile.Close()
	outFile, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer outFile.Close()
	dec, err := rtcrec.MakeWebRTCDecoder(inFile)
	if err != nil {
		return err
	}
	encoder, err := rtcrec.MakeWebRTCEncoder(outFile)
	if err != nil {
		return err
	}
	var cutoff *time.Time
	included := 0
	dropped := 0
	for {
		ev, err := dec.Next()
		if errors.Is(err, io.EOF) {
			break
		}
		if cutoff == nil {
			t := ev.Time.Add(duration)
			cutoff = &t
		}
		// we only rewrite trackread events
		if ev.TrackRead == nil {
			// included++
			encoder.Event(*ev)
			continue
		}
		if ev.Time.Before(*cutoff) {
			// fmt.Printf("dropped: %s < %s\n", ev.Time.Format(time.RFC3339Nano), cutoff.Format(time.RFC3339Nano))
			dropped++
			continue
		}
		included++
		ev.Time = ev.Time.Add(-duration)
		encoder.Event(*ev)
	}
	fmt.Printf("included: %d, dropped: %d\n", included, dropped)
	return nil
}

func Decode() error {
	var path string
	flag.StringVar(&path, "path", "", "path to the file to decode")
	flag.Parse()
	if path == "" {
		return fmt.Errorf("path is required")
	}
	return DecodeFile(path)
}

func DecodeFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	dec, err := rtcrec.MakeWebRTCDecoder(f)
	if err != nil {
		return err
	}
	for {
		ev, err := dec.Next()
		if errors.Is(err, io.EOF) {
			return nil
		}
		if err != nil {
			return err
		}
		if ev.TrackRead != nil {
			// spitting out the data as base64 is pointless, replace with a label
			n := len(ev.TrackRead.Data)
			byteString := fmt.Sprintf("%d bytes", n)
			bs, err := json.Marshal(ev)
			if err != nil {
				return err
			}
			var m map[string]any
			err = json.Unmarshal(bs, &m)
			if err != nil {
				return err
			}
			m["trackRead"].(map[string]any)["data"] = byteString
			bs, err = json.Marshal(m)
			if err != nil {
				return err
			}
			fmt.Println(string(bs))
		} else {
			bs, err := json.Marshal(ev)
			if err != nil {
				return err
			}
			fmt.Println(string(bs))
		}
	}
}
