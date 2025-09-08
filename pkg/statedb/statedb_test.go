package statedb

import (
	"testing"

	"github.com/stretchr/testify/require"
	"stream.place/streamplace/pkg/config"
	"stream.place/streamplace/pkg/model"
)

// var postgresURL string

// func TestMain(m *testing.M) {
// 	postgresCommand := os.Getenv("STREAMPLACE_TEST_POSTGRES_COMMAND")
// 	postgresURL = os.Getenv("STREAMPLACE_TEST_POSTGRES_URL")
// 	if postgresCommand != "" {
// 		// Start postgres process
// 		fmt.Printf("Starting postgres process with command: %s\n", postgresCommand)
// 		cmd := exec.Command("bash", "-c", postgresCommand)
// 		err := cmd.Start()
// 		if err != nil {
// 			fmt.Printf("Failed to start postgres: %v\n", err)
// 			os.Exit(1)
// 		}

// 		// Give postgres time to start up
// 		time.Sleep(2 * time.Second)

// 		// Run tests
// 		exitCode := m.Run()

// 		// Clean up postgres process
// 		if cmd.Process != nil {
// 			cmd2 := exec.Command("pkill", "postgres")
// 			err := cmd2.Run()
// 			if err != nil {
// 				fmt.Printf("Failed to kill postgres: %v\n", err)
// 			}
// 		}

// 		os.Exit(exitCode)
// 		return
// 	}
// 	os.Exit(m.Run())
// }

// func makePostgresURL(t *testing.T) string {
// 	u, err := url.Parse(postgresURL)
// 	if err != nil {
// 		panic(err)
// 	}
// 	uu, err := uuid.NewV7()
// 	if err != nil {
// 		panic(err)
// 	}
// 	dbName := fmt.Sprintf("test_%s", strings.ReplaceAll(uu.String(), "-", "_"))
// 	u.Path = fmt.Sprintf("/%s", dbName)
// 	t.Cleanup(func() {
// 		u, err := url.Parse(postgresURL)
// 		if err != nil {
// 			panic(err)
// 		}
// 		u.Path = "/postgres"
// 		rootDial := postgres.Open(u.String())

// 		db, err := openDB(rootDial)
// 		if err != nil {
// 			t.Logf("Failed to open database: %v", err)
// 			return
// 		}

// 		// Drop the test database
// 		err = db.Exec(fmt.Sprintf("DROP DATABASE %s", dbName)).Error
// 		if err != nil {
// 			t.Logf("Failed to drop test database: %v", err)
// 		}
// 	})
// 	return u.String()
// }

// run the inner testing function against all databases we support
func WithAllDatabases(t *testing.T, f func(*StatefulDB)) {
	t.Run("sqlite", func(t *testing.T) {
		cli := config.CLI{
			DBURL: ":memory:",
		}
		mod, err := model.MakeDB(":memory:")
		require.NoError(t, err)
		state, err := MakeDB(t.Context(), &cli, nil, mod)
		require.NoError(t, err)
		f(state)
	})
	if postgresURL == "" {
		t.Log("no postgres url, skipping postgres tests")
		return
	} else {
		t.Run("postgres", func(t *testing.T) {
			dburl := makePostgresURL(t)
			cli := config.CLI{
				DBURL: dburl,
			}
			mod, err := model.MakeDB(":memory:")
			require.NoError(t, err)
			state, err := MakeDB(t.Context(), &cli, nil, mod)
			require.NoError(t, err)
			f(state)
			sqlDB, err := state.DB.DB()
			require.NoError(t, err)

			// Close
			sqlDB.Close()
		})
	}
}
