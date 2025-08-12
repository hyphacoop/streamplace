package statedb

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/lmittmann/tint"
	slogGorm "github.com/orandin/slog-gorm"
	"github.com/streamplace/oatproxy/pkg/oatproxy"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/log"
)

type StatefulDB struct {
	DB  *gorm.DB
	CLI *config.CLI
}

// list tables here so we can migrate them
var StatefulDBModels = []any{
	oatproxy.OAuthSession{},
	Notification{},
	Config{},
}

var NoPostgresDatabaseCode = "3D000"

// Stateful database for storing private streamplace state
func MakeDB(cli *config.CLI) (*StatefulDB, error) {
	dbURL := cli.DBURL
	log.Log(context.Background(), "starting stateful database", "dbURL", redactDBURL(dbURL))
	var dial gorm.Dialector
	isSQLite := false
	isPostgres := false
	if dbURL == ":memory:" {
		dial = sqlite.Open(":memory:")
		isSQLite = true
	} else if strings.HasPrefix(dbURL, "sqlite://") {
		dial = sqlite.Open(dbURL[len("sqlite://"):])
		isSQLite = true
	} else if strings.HasPrefix(dbURL, "postgres://") {
		dial = postgres.Open(dbURL)
		isPostgres = true
	} else {
		return nil, fmt.Errorf("unsupported database URL (most start with sqlite:// or postgres://): %s", redactDBURL(dbURL))
	}

	db, err := openDB(dial)

	if err != nil {
		if isPostgres && strings.Contains(err.Error(), NoPostgresDatabaseCode) {
			db, err = makePostgresDB(dbURL)
			if err != nil {
				return nil, fmt.Errorf("error creating streamplace database: %w", err)
			}
		} else {
			return nil, fmt.Errorf("error starting database: %w", err)
		}
	}
	if isSQLite {
		err = db.Exec("PRAGMA journal_mode=WAL;").Error
		if err != nil {
			return nil, fmt.Errorf("error setting journal mode: %w", err)
		}
		sqlDB, err := db.DB()
		if err != nil {
			return nil, fmt.Errorf("error getting database: %w", err)
		}
		sqlDB.SetMaxOpenConns(1)
	}
	for _, model := range StatefulDBModels {
		err = db.AutoMigrate(model)
		if err != nil {
			return nil, err
		}
	}
	return &StatefulDB{DB: db, CLI: cli}, nil
}

func openDB(dial gorm.Dialector) (*gorm.DB, error) {
	gormLogger := slogGorm.New(
		slogGorm.WithHandler(tint.NewHandler(os.Stderr, &tint.Options{
			TimeFormat: time.RFC3339,
		})),
		// slogGorm.WithTraceAll(),
	)

	return gorm.Open(dial, &gorm.Config{
		SkipDefaultTransaction: true,
		TranslateError:         true,
		Logger:                 gormLogger,
	})
}

// helper function for creating the requested postgres database
func makePostgresDB(dbURL string) (*gorm.DB, error) {
	u, err := url.Parse(dbURL)
	if err != nil {
		return nil, err
	}
	dbName := strings.TrimPrefix(u.Path, "/")
	u.Path = "/postgres"

	rootDial := postgres.Open(u.String())

	db, err := openDB(rootDial)
	if err != nil {
		return nil, err
	}

	// postgres doesn't support prepared statements for CREATE DATABASE. don't SQL inject yourself.
	err = db.Exec(fmt.Sprintf("CREATE DATABASE %s;", dbName)).Error
	if err != nil {
		return nil, err
	}

	log.Warn(context.Background(), "created postgres database", "dbName", dbName)

	realDial := postgres.Open(dbURL)

	return openDB(realDial)
}

func redactDBURL(dbURL string) string {
	u, err := url.Parse(dbURL)
	if err != nil {
		return "db url is malformed"
	}
	if u.User != nil {
		u.User = url.UserPassword(u.User.Username(), "redacted")
	}
	return u.String()
}
